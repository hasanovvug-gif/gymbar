import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Heading, OutlineButton, PrimaryButton, Screen, Tappable } from '@/components/ui';
import { fonts, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { type TranslationKey, useT } from '@/i18n';
import { useGymStore } from '@/store/useGymStore';
import { SUPPLEMENT_SLOTS, type Supplement, type SupplementSlot } from '@/types/supplement';
import {
  draftFromScan,
  isScanConfigured,
  MAX_NOTE_CHARS,
  MAX_PHOTOS,
  COMPOSITION_UNIT_KEYS,
  ScanError,
  scanSupplement,
  STOCK_UNIT_KEYS,
  type FieldSource,
  type ScanResult,
  type SupplementDraft,
} from '@/utils/aiScan';

type Step = 'capture' | 'loading' | 'preview';

const slotKeys = {
  morning: 'supplements.morning',
  pre_workout: 'supplements.preWorkout',
  evening: 'supplements.evening',
} satisfies Record<SupplementSlot, TranslationKey>;

const sourceKeys: Record<FieldSource, TranslationKey> = {
  label: 'scan.srcLabel',
  user_note: 'scan.srcNote',
  inferred: 'scan.srcInferred',
};

const errorKeys: Record<string, TranslationKey> = {
  not_configured: 'scan.errNotConfigured',
  no_photos: 'scan.errNoPhotos',
  photo_too_large: 'scan.errPhotoTooLarge',
  rate_limited: 'scan.errRateLimited',
  timeout: 'scan.errTimeout',
  network: 'scan.errNetwork',
  server: 'scan.errServer',
};

/** На экран можно попасть по прямой ссылке — тогда истории нет и back() ничего не сделает. */
const goBack = () => (router.canGoBack() ? router.back() : router.replace('/supplements'));

/** Постоянная копия фото — только после Save; временные файлы пикера система чистит сама. */
function persistPhotos(uris: string[], supplementId: string) {
  const saved: string[] = [];
  try {
    const folder = new Directory(Paths.document, 'supplement-photos');
    if (!folder.exists) folder.create({ intermediates: true });
    uris.forEach((uri, index) => {
      try {
        const target = new File(folder, `${supplementId}-${index}.jpg`);
        if (target.exists) target.delete();
        new File(uri).copy(target);
        saved.push(target.uri);
      } catch {
        // Фото не критично для карточки — теряем снимок, но не саму добавку
      }
    });
  } catch {
    // Нет документной папки (например, web) — сохраняем добавку без фото
  }
  return saved;
}

export default function SupplementScanScreen() {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { t, language } = useT();
  const addScannedSupplement = useGymStore((state) => state.addScannedSupplement);

  const [step, setStep] = useState<Step>('capture');
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [draft, setDraft] = useState<SupplementDraft | null>(null);
  const unitLabel = (code: string) => {
    const key = COMPOSITION_UNIT_KEYS[code];
    return key ? t(key) : code;
  };

  const addPhotos = async (from: 'camera' | 'library') => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const permission = from === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('scan.permTitle'), t(from === 'camera' ? 'scan.permCamera' : 'scan.permGallery'));
      return;
    }
    const picked = from === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, exif: false })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
          exif: false,
          allowsMultipleSelection: true,
          selectionLimit: remaining,
        });
    if (picked.canceled) return;
    setPhotos((current) => [...current, ...picked.assets.map((asset) => asset.uri)].slice(0, MAX_PHOTOS));
  };

  const recognize = async () => {
    setStep('loading');
    try {
      const scan = await scanSupplement(photos, note, language);
      setResult(scan);
      const unitKey = (code: string) => STOCK_UNIT_KEYS[code.toLowerCase()];
      setDraft(draftFromScan(scan, t('scan.fallbackName'), t('scan.fallbackUnit'), (code) => {
        const key = unitKey(code);
        return key ? t(key) : code;
      }));
      setStep('preview');
    } catch (error) {
      const code = error instanceof ScanError ? error.code : 'server';
      setStep('capture');
      Alert.alert(t('scan.errTitle'), t(errorKeys[code] ?? 'scan.errServer'));
    }
  };

  const save = () => {
    if (!draft) return;
    const id = `supplement-${Date.now()}`;
    const supplement: Omit<Supplement, 'id'> = {
      name: draft.name.trim() || t('scan.fallbackName'),
      dose: draft.dose.trim(),
      stock: draft.stock,
      capacity: Math.max(draft.stock, draft.capacity),
      stockUnit: draft.stockUnit.trim() || t('scan.fallbackUnit'),
      unitsPerDose: draft.unitsPerDose,
      schedule: draft.schedule,
      brand: draft.brand.trim() || undefined,
      form: draft.form,
      composition: draft.composition.length > 0 ? draft.composition : undefined,
      servingsPerContainer: draft.servingsPerContainer,
      seller: draft.seller.trim() || undefined,
      sourceUrl: draft.sourceUrl.trim() || undefined,
      note: note.trim() || undefined,
      photos: persistPhotos(photos, id),
      createdBy: 'ai',
    };
    addScannedSupplement(supplement);
    goBack();
  };

  if (step === 'loading') {
    return (
      <Screen scroll={false}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={c.accentInk} size="large" />
          <Text style={styles.loadingTitle}>{t('scan.recognizing')}</Text>
          <Text style={styles.loadingHint}>{t('scan.recognizingHint')}</Text>
        </View>
      </Screen>
    );
  }

  if (step === 'preview' && draft && result) {
    return (
      <Screen>
        <Tappable haptic="select" onPress={() => setStep('capture')}><Text style={styles.back}>{t('scan.backToPhotos')}</Text></Tappable>
        <Heading>{t('scan.previewTitle')}</Heading>

        {result.status === 'needs_more_input' && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{t('scan.needsMoreInput')}</Text>
            {result.missingFields.map((item) => <Text key={item} style={styles.bannerItem}>· {item}</Text>)}
          </View>
        )}
        {result.status === 'unsupported' && (
          <View style={styles.banner}><Text style={styles.bannerText}>{t('scan.unsupported')}</Text></View>
        )}
        {result.warnings.map((warning) => (
          <View key={warning} style={styles.banner}><Text style={styles.bannerItem}>{warning}</Text></View>
        ))}

        <Card style={styles.formCard}>
          <Field label={t('scan.fieldName')} source={draft.sources.name} value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
          <Field label={t('scan.fieldBrand')} source={draft.sources.brand} value={draft.brand} onChange={(brand) => setDraft({ ...draft, brand })} />
          <Field label={t('scan.fieldDose')} source={draft.sources.dose} value={draft.dose} onChange={(dose) => setDraft({ ...draft, dose })} />
          <View style={styles.row}>
            <Field style={styles.rowItem} label={t('scan.fieldStockUnit')} source={draft.sources.stockUnit} value={draft.stockUnit} onChange={(stockUnit) => setDraft({ ...draft, stockUnit })} />
            <Field
              style={styles.rowItem}
              label={t('scan.fieldStock')}
              value={String(draft.stock)}
              keyboardType="number-pad"
              onChange={(text) => {
                const stock = Number(text.replace(/[^0-9]/g, '')) || 0;
                setDraft({ ...draft, stock, capacity: Math.max(stock, draft.capacity) });
              }}
            />
          </View>
          <Field label={t('scan.fieldSeller')} source={draft.sources.seller} value={draft.seller} onChange={(seller) => setDraft({ ...draft, seller })} />
        </Card>

        <View style={styles.slotBlock}>
          <Text style={styles.sectionLabel}>{t('scan.slots')}</Text>
          <View style={styles.slotRow}>
            {SUPPLEMENT_SLOTS.map((slot) => {
              const selected = draft.schedule.includes(slot);
              return (
                <Tappable
                  haptic="select"
                  key={slot}
                  onPress={() => setDraft({
                    ...draft,
                    schedule: selected ? draft.schedule.filter((item) => item !== slot) : [...draft.schedule, slot],
                  })}
                  style={[styles.slotChip, selected && styles.slotChipSelected]}
                >
                  <Text style={[styles.slotChipText, selected && styles.slotChipTextSelected]}>{t(slotKeys[slot])}</Text>
                </Tappable>
              );
            })}
          </View>
        </View>

        {draft.directions !== '' && (
          <Card style={styles.readonlyCard}>
            <Text style={styles.sectionLabel}>{t('scan.directions')}</Text>
            <Text style={styles.readonlyText}>{draft.directions}</Text>
          </Card>
        )}

        {draft.composition.length > 0 && (
          <Card style={styles.readonlyCard}>
            <Text style={styles.sectionLabel}>{t('scan.composition')}</Text>
            {draft.composition.map((item) => (
              <View key={item.name} style={styles.compositionRow}>
                <Text style={styles.compositionName}>{item.name}</Text>
                <Text style={styles.compositionAmount}>
                  {item.amount !== undefined ? `${item.amount} ${item.unit ? unitLabel(item.unit) : ''}`.trim() : '—'}
                </Text>
              </View>
            ))}
          </Card>
        )}

        <PrimaryButton label={t('scan.save')} onPress={save} />
        <OutlineButton label={t('common.cancel')} onPress={goBack} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Tappable haptic="select" onPress={goBack}><Text style={styles.back}>{t('scan.back')}</Text></Tappable>
      <Heading>{t('scan.title')}</Heading>
      <Text style={styles.hint}>{t('scan.photoHint')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
        {photos.map((uri, index) => (
          <View key={uri} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
            <Tappable
              haptic="warn"
              onPress={() => setPhotos((current) => current.filter((_, item) => item !== index))}
              style={styles.thumbRemove}
            >
              <Text style={styles.thumbRemoveText}>×</Text>
            </Tappable>
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <>
            <Tappable haptic="select" onPress={() => addPhotos('camera')} style={styles.addTile}>
              <Text style={styles.addTileText}>{t('scan.camera')}</Text>
            </Tappable>
            <Tappable haptic="select" onPress={() => addPhotos('library')} style={styles.addTile}>
              <Text style={styles.addTileText}>{t('scan.gallery')}</Text>
            </Tappable>
          </>
        )}
      </ScrollView>

      <View style={styles.noteBlock}>
        <Text style={styles.sectionLabel}>{t('scan.noteLabel')}</Text>
        <TextInput
          value={note}
          onChangeText={(text) => setNote(text.slice(0, MAX_NOTE_CHARS))}
          placeholder={t('scan.notePlaceholder')}
          placeholderTextColor={c.textDim}
          multiline
          style={styles.noteInput}
        />
      </View>

      <Text style={styles.privacy}>{t('scan.privacy')}</Text>
      <PrimaryButton label={t('scan.recognize')} onPress={recognize} disabled={photos.length === 0 || !isScanConfigured()} />
      {!isScanConfigured() && <Text style={styles.privacy}>{t('scan.errNotConfigured')}</Text>}
    </Screen>
  );
}

function Field({ label, value, source, onChange, keyboardType, style }: {
  label: string;
  value: string;
  source?: FieldSource;
  onChange: (value: string) => void;
  keyboardType?: 'default' | 'number-pad';
  style?: object;
}) {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { t } = useT();
  return (
    <View style={[styles.field, style]}>
      <View style={styles.fieldHead}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {source && <Text style={styles.sourceBadge}>{t(sourceKeys[source])}</Text>}
      </View>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboardType} style={styles.fieldInput} accessibilityLabel={label} />
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  back: { color: c.textSecondary, fontFamily: fonts.bodyBold, fontSize: 13, marginBottom: 2 },
  hint: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  photoStrip: { gap: 10, paddingVertical: 4 },
  thumbWrap: { width: 96, height: 128 },
  thumb: { width: 96, height: 128, borderRadius: 14, backgroundColor: c.surfaceInset },
  thumbRemove: { position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: 14, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center' },
  thumbRemoveText: { color: '#FFFFFF', fontFamily: fonts.bodyExtraBold, fontSize: 15, lineHeight: 18 },
  addTile: { width: 96, height: 128, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderDashed, alignItems: 'center', justifyContent: 'center' },
  addTileText: { color: c.accentInk, fontFamily: fonts.bodyBold, fontSize: 12 },
  noteBlock: { gap: 7 },
  noteInput: { minHeight: 84, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 12, color: c.textPrimary, fontFamily: fonts.body, fontSize: 14, textAlignVertical: 'top' },
  privacy: { color: c.textDim, fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
  sectionLabel: { color: c.textMuted, fontFamily: fonts.bodyExtraBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTitle: { color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 16 },
  loadingHint: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
  banner: { backgroundColor: c.warningBg, borderWidth: 1, borderColor: c.warning, borderRadius: 16, padding: 13, gap: 4 },
  bannerText: { color: c.warning, fontFamily: fonts.bodyBold, fontSize: 13 },
  bannerItem: { color: c.warning, fontFamily: fonts.body, fontSize: 12 },
  formCard: { gap: 12, paddingVertical: 14 },
  field: { gap: 5 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  fieldLabel: { color: c.textMuted, fontFamily: fonts.bodyExtraBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2 },
  sourceBadge: { color: c.accentInk, backgroundColor: c.accentSurface, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, fontFamily: fonts.bodyBold, fontSize: 9 },
  fieldInput: { minHeight: 42, borderBottomWidth: 1, borderBottomColor: c.border, color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  slotBlock: { gap: 8 },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  slotChip: { minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: c.borderDashed, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  slotChipSelected: { backgroundColor: c.accent, borderColor: c.accent },
  slotChipText: { color: c.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 11 },
  slotChipTextSelected: { color: c.accentText, fontFamily: fonts.bodyExtraBold },
  readonlyCard: { gap: 8, paddingVertical: 13 },
  readonlyText: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  compositionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  compositionName: { flex: 1, color: c.textPrimary, fontFamily: fonts.body, fontSize: 13 },
  compositionAmount: { color: c.textSecondary, fontFamily: fonts.bodyBold, fontSize: 13 },
});
