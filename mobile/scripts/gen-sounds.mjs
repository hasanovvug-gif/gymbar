import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44_100;
const OUTPUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/sounds');

// Тоны специально простые: владелец сможет подстроить частоты и громкость по слуху на устройстве.
const sounds = {
  'rest-done.wav': { frequencies: [880, 880, 1320], toneSeconds: 0.12, pauseSeconds: 0.05, amplitude: 0.9 },
  'rest-soon.wav': { frequencies: [587, 587], toneSeconds: 0.08, pauseSeconds: 0.05, amplitude: 0.5 },
};

function createSamples({ frequencies, toneSeconds, pauseSeconds, amplitude }) {
  const samples = [];
  const toneSampleCount = Math.round(toneSeconds * SAMPLE_RATE);
  const pauseSampleCount = Math.round(pauseSeconds * SAMPLE_RATE);
  const fadeSampleCount = Math.round(0.008 * SAMPLE_RATE);

  frequencies.forEach((frequency, toneIndex) => {
    for (let index = 0; index < toneSampleCount; index += 1) {
      const attack = Math.min(1, index / fadeSampleCount);
      const release = Math.min(1, (toneSampleCount - index - 1) / fadeSampleCount);
      const envelope = Math.min(attack, release);
      samples.push(Math.sin((2 * Math.PI * frequency * index) / SAMPLE_RATE) * amplitude * envelope);
    }
    if (toneIndex < frequencies.length - 1) {
      samples.push(...new Array(pauseSampleCount).fill(0));
    }
  });

  return samples;
}

function createWav(samples) {
  const dataSize = samples.length * 2;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + index * 2);
  });
  return wav;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const [filename, definition] of Object.entries(sounds)) {
  writeFileSync(resolve(OUTPUT_DIR, filename), createWav(createSamples(definition)));
}
