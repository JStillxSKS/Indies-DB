/**
 * Creates a minimal synthetic .indies pack for parser tests.
 * Does NOT use any user maps from Desktop.
 */
import JSZip from 'jszip'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, '..', 'test-fixtures')
mkdirSync(outDir, { recursive: true })

const meta = {
  NameArtist: 'Synthetic Test Artist',
  NameSong: 'Synthetic Test Song',
  NameCharter: 'TestFixture',
  FilePath: 'audio.ogg',
  SongOffsetSeconds: 0,
  SongTiming: [
    { beat: 0, timer: 0 },
    { beat: 4, timer: 2 },
  ],
  SongPhases: [{ beat: 0, phase: 1, power: 1, phaseName: 'Intro' }],
  ChartEasy: [{ Beat: 4, Id: 0, Strength: 1 }],
  ChartNormal: [
    { Beat: 4, Id: 0, Strength: 1 },
    { Beat: 8, Id: 1, Strength: 1 },
  ],
  ChartHard: [
    { Beat: 4, Id: 0, Strength: 1 },
    { Beat: 8, Id: 1, Strength: 1 },
    { Beat: 12, Id: 2, Strength: 1 },
  ],
  ChartExtreme: [
    { Beat: 4, Id: 0, Strength: 1 },
    { Beat: 8, Id: 1, Strength: 2 },
    { Beat: 12, Id: 2, Strength: 1 },
    { Beat: 16, Id: 4, Strength: 0 },
  ],
}

const zip = new JSZip()
zip.file('meta.json', JSON.stringify(meta, null, 2))
zip.file('audio.ogg', Buffer.alloc(64, 0))
zip.file('preview.wav', Buffer.alloc(32, 0))

const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
zip.file('cover.png', png1x1)

const outPath = join(outDir, 'synthetic-test.indies')
const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
writeFileSync(outPath, buf)
console.log('Created:', outPath)