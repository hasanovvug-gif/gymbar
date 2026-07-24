import Constants from 'expo-constants';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { AppLanguage, TranslationKey } from '@/i18n';
import type { CompositionItem, SupplementForm, SupplementSlot } from '@/types/supplement';
import { SUPPLEMENT_FORMS, SUPPLEMENT_SLOTS } from '@/types/supplement';

// Лимиты воркера (worker/src/index.ts): 3 фото, 1.5 МБ base64 на фото, 500 символов заметки.
export const MAX_PHOTOS = 3;
export const MAX_NOTE_CHARS = 500;
const MAX_IMAGE_BASE64 = 1_500_000;
const RESIZE_WIDTH = 1280;
const COMPRESS_STEPS = [0.7, 0.5, 0.35];
// Воркер отдаёт 504 на 55 с; клиенту даём чуть больше, чтобы увидеть его ответ, а не свой обрыв.
const REQUEST_TIMEOUT_MS = 60_000;

export type FieldSource = 'label' | 'user_note' | 'inferred';
export type ScanField<T> = { value: T; source: FieldSource; confidence: number } | null;

export type ScanCard = {
  name: ScanField<string>;
  brand: ScanField<string>;
  form: ScanField<string>;
  servingSize: ScanField<string>;
  servingsPerContainer: ScanField<number>;
  stockUnit: ScanField<string>;
  unitsPerDose: ScanField<number>;
  directions: ScanField<string>;
  seller: ScanField<string>;
  sourceUrl: ScanField<string>;
  composition: CompositionItem[];
};

export type ScanResult = {
  schemaVersion: 1;
  status: 'ok' | 'needs_more_input' | 'unsupported';
  card: ScanCard;
  regimenDraft: { slot: string; time: string | null; amountText: string }[];
  warnings: string[];
  missingFields: string[];
};

export type ScanErrorCode =
  | 'not_configured'
  | 'no_photos'
  | 'photo_too_large'
  | 'rate_limited'
  | 'timeout'
  | 'network'
  | 'server';

export class ScanError extends Error {
  code: ScanErrorCode;

  constructor(code: ScanErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const proxyUrl = () => (Constants.expoConfig?.extra?.aiProxyUrl as string | undefined)?.replace(/\/$/, '');
const appToken = () => process.env.EXPO_PUBLIC_AI_PROXY_TOKEN;

export const isScanConfigured = () => Boolean(proxyUrl() && appToken());

/** Ужимает фото до bounded JPEG и отдаёт base64. Ресайз заодно срезает EXIF/GPS. */
async function prepareImage(uri: string): Promise<{ mimeType: string; data: string }> {
  const context = ImageManipulator.manipulate(uri).resize({ width: RESIZE_WIDTH });
  const rendered = await context.renderAsync();
  for (const compress of COMPRESS_STEPS) {
    const saved = await rendered.saveAsync({ compress, format: SaveFormat.JPEG, base64: true });
    if (saved.base64 && saved.base64.length <= MAX_IMAGE_BASE64) {
      return { mimeType: 'image/jpeg', data: saved.base64 };
    }
  }
  throw new ScanError('photo_too_large');
}

export async function scanSupplement(
  photoUris: string[],
  note: string,
  language: AppLanguage,
): Promise<ScanResult> {
  const base = proxyUrl();
  const token = appToken();
  if (!base || !token) throw new ScanError('not_configured');
  if (photoUris.length === 0) throw new ScanError('no_photos');

  const images = [];
  for (const uri of photoUris.slice(0, MAX_PHOTOS)) {
    images.push(await prepareImage(uri));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${base}/supplement-scan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-token': token },
      body: JSON.stringify({ images, note: note.slice(0, MAX_NOTE_CHARS), language }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ScanError(controller.signal.aborted ? 'timeout' : 'network', String(error));
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) throw new ScanError('rate_limited');
  if (response.status === 504) throw new ScanError('timeout');
  if (!response.ok) throw new ScanError('server', `HTTP ${response.status}`);

  const parsed = (await response.json()) as ScanResult;
  if (!parsed || typeof parsed !== 'object' || !parsed.card) throw new ScanError('server', 'malformed response');
  return parsed;
}

/** Черновик карточки для экрана предпросмотра. ID генерирует клиент, не модель. */
export type SupplementDraft = {
  name: string;
  dose: string;
  brand: string;
  form?: SupplementForm;
  stockUnit: string;
  unitsPerDose: number;
  servingsPerContainer?: number;
  stock: number;
  capacity: number;
  seller: string;
  sourceUrl: string;
  composition: CompositionItem[];
  schedule: SupplementSlot[];
  directions: string;
  sources: Partial<Record<'name' | 'brand' | 'dose' | 'stockUnit' | 'seller', FieldSource>>;
};

const value = <T>(field: ScanField<T>) => (field ? field.value : undefined);

/** Воркер отдаёт stockUnit фиксированным английским кодом — в UI показываем человеческое слово. */
export const STOCK_UNIT_KEYS: Record<string, TranslationKey> = {
  servings: 'seed.stockUnitServings',
  serving: 'seed.stockUnitServings',
  capsules: 'seed.stockUnitCapsules',
  capsule: 'seed.stockUnitCapsules',
  tablets: 'seed.stockUnitTablets',
  tablet: 'seed.stockUnitTablets',
  scoop: 'scan.unitScoop',
};

/** Единицы состава — тоже фиксированные коды воркера. */
export const COMPOSITION_UNIT_KEYS: Record<string, TranslationKey> = {
  g: 'scan.unitG',
  mg: 'scan.unitMg',
  mcg: 'scan.unitMcg',
  IU: 'scan.unitIu',
  ml: 'scan.unitMl',
  l: 'scan.unitL',
  kcal: 'scan.unitKcal',
};

export function draftFromScan(
  result: ScanResult,
  fallbackName: string,
  fallbackUnit: string,
  translateUnit: (code: string) => string,
): SupplementDraft {
  const card = result.card;
  const servings = value(card.servingsPerContainer);
  const form = value(card.form);
  const slots = result.regimenDraft
    .map((entry) => entry.slot)
    .filter((slot): slot is SupplementSlot => (SUPPLEMENT_SLOTS as readonly string[]).includes(slot));

  return {
    name: value(card.name) ?? fallbackName,
    dose: value(card.servingSize) ?? '',
    brand: value(card.brand) ?? '',
    form: form && (SUPPLEMENT_FORMS as readonly string[]).includes(form) ? (form as SupplementForm) : undefined,
    stockUnit: translateUnit(value(card.stockUnit) ?? '') || fallbackUnit,
    unitsPerDose: value(card.unitsPerDose) ?? 1,
    servingsPerContainer: servings,
    stock: servings ?? 30,
    capacity: servings ?? 30,
    seller: value(card.seller) ?? '',
    sourceUrl: value(card.sourceUrl) ?? '',
    composition: card.composition ?? [],
    schedule: slots.length > 0 ? Array.from(new Set(slots)) : ['morning'],
    directions: value(card.directions) ?? '',
    sources: {
      name: card.name?.source,
      brand: card.brand?.source,
      dose: card.servingSize?.source,
      stockUnit: card.stockUnit?.source,
      seller: card.seller?.source,
    },
  };
}
