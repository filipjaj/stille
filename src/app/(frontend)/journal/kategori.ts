import type { Article } from '@/payload-types'

/** Journalens kategorier, i rekkefølgen filteret viser dem. */
export const JOURNAL_CATEGORIES: Article['category'][] = ['rom', 'materialer', 'mennesker']

export const JOURNAL_CATEGORY_LABELS: Record<Article['category'], string> = {
  rom: 'Rom',
  materialer: 'Materialer',
  mennesker: 'Mennesker',
}

/** Typevakt for verdien i `?kategori=`-parameteren — ukjente verdier faller tilbake på "alle". */
export function isJournalCategory(value: string | undefined): value is Article['category'] {
  return value !== undefined && (JOURNAL_CATEGORIES as string[]).includes(value)
}
