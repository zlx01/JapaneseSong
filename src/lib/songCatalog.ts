interface ExportLyricLine {
  japanese: string
  furiganaMap: { [key: number]: string }
  chinese: string
  isBreak: boolean
}

export interface ExportData {
  version: string
  lyrics: ExportLyricLine[]
}

export interface SongMeta {
  id: string
  title: string
}

const songModules = import.meta.glob('../assets/lyrics/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, ExportData>

const songs = Object.entries(songModules)
  .map(([path, data]) => {
    const fileName = path.split('/').pop()?.replace(/\.json$/i, '') ?? ''
    return {
      id: fileName,
      title: fileName,
      data,
    }
  })
  .sort((a, b) => a.title.localeCompare(b.title, 'ja'))

export const getSongs = (): SongMeta[] => songs.map(({ id, title }) => ({ id, title }))

export const getSongById = (id: string): ExportData | null => {
  const song = songs.find((item) => item.id === id)
  return song?.data ?? null
}

