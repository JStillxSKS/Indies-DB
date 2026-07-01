/**
 * Validates .indies parsing against synthetic fixture only.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const __dir = dirname(fileURLToPath(import.meta.url))
const fixture = join(__dir, '..', 'test-fixtures', 'synthetic-test.indies')

if (!existsSync(fixture)) {
  console.error('Missing fixture. Run: npm run fixture')
  process.exit(1)
}

function bpmFromAnchors(anchors) {
  const sorted = [...anchors].sort((a, b) => a.beat - b.beat)
  if (sorted.length < 2) return 120
  const span = sorted[1].timer - sorted[0].timer
  const beats = sorted[1].beat - sorted[0].beat
  if (span <= 0 || beats <= 0) return 120
  return Math.round(((beats / span) * 60) * 10) / 10
}

const buf = readFileSync(fixture)
const zip = await JSZip.loadAsync(buf)
const meta = JSON.parse(await zip.file('meta.json').async('string'))

const extreme = meta.ChartExtreme?.length ?? 0
if (extreme < 1) throw new Error('ChartExtreme empty')
if (!zip.file('audio.ogg')) throw new Error('missing audio.ogg')

const difficulties = {
  easy: meta.ChartEasy?.length ?? 0,
  normal: meta.ChartNormal?.length ?? 0,
  hard: meta.ChartHard?.length ?? 0,
  extreme,
}

console.log('Parser test OK')
console.log('  title:', meta.NameSong)
console.log('  artist:', meta.NameArtist)
console.log('  charter:', meta.NameCharter)
console.log('  bpm:', bpmFromAnchors(meta.SongTiming))
console.log('  difficulties:', difficulties)