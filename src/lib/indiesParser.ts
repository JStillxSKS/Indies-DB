import JSZip from 'jszip'
import type { DifficultyCounts, ParsedIndies } from '../types/map'

type TimingAnchor = { beat: number; timer: number }

type MetaJson = {
  NameArtist?: string
  NameSong?: string
  NameCharter?: string
  SongTiming?: TimingAnchor[]
  ChartEasy?: unknown[]
  ChartNormal?: unknown[]
  ChartHard?: unknown[]
  ChartExtreme?: unknown[]
}

function bpmFromAnchors(anchors: TimingAnchor[]): number {
  const sorted = [...anchors].sort((a, b) => a.beat - b.beat)
  if (sorted.length < 2) return 120
  const span = sorted[1].timer - sorted[0].timer
  const beats = sorted[1].beat - sorted[0].beat
  if (span <= 0 || beats <= 0) return 120
  return Math.round(((beats / span) * 60) * 10) / 10
}

function countNotes(arr: unknown[] | undefined): number {
  return Array.isArray(arr) ? arr.length : 0
}

export async function parseIndiesBuffer(
  data: ArrayBuffer,
  filename: string,
): Promise<Omit<ParsedIndies, 'file'>> {
  const lower = filename.toLowerCase()
  if (!lower.endsWith('.indies')) {
    throw new Error('Please upload a .indies file')
  }

  const zip = await JSZip.loadAsync(data)
  const metaEntry = zip.file('meta.json')
  if (!metaEntry) throw new Error('Invalid pack: missing meta.json')

  const meta = JSON.parse(await metaEntry.async('string')) as MetaJson
  const extreme = countNotes(meta.ChartExtreme)
  if (extreme < 1) {
    throw new Error('Invalid pack: ChartExtreme must have at least one note')
  }

  if (!zip.file('audio.ogg')) {
    throw new Error('Invalid pack: missing audio.ogg')
  }

  const difficulties: DifficultyCounts = {
    easy: countNotes(meta.ChartEasy),
    normal: countNotes(meta.ChartNormal),
    hard: countNotes(meta.ChartHard),
    extreme,
  }

  let coverBlob: Blob | null = null
  const coverEntry = zip.file('cover.png')
  if (coverEntry) {
    coverBlob = await coverEntry.async('blob')
  }

  return {
    title: meta.NameSong?.trim() || 'Untitled Song',
    artist: meta.NameArtist?.trim() || 'Unknown Artist',
    charter: meta.NameCharter?.trim() || 'Unknown Charter',
    bpmEst: bpmFromAnchors(meta.SongTiming ?? []),
    difficulties,
    coverBlob,
  }
}

export async function parseIndiesFile(file: File): Promise<ParsedIndies> {
  const parsed = await parseIndiesBuffer(await file.arrayBuffer(), file.name)
  return { ...parsed, file }
}