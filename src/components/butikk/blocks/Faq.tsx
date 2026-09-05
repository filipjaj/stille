import { Accordion, type AccordionItem } from '@/components/stille/Accordion'
import { EmptyState } from '@/components/stille/EmptyState'
import { getPayloadClient } from '@/lib/payload'
import type { Faq, FaqBlock as FaqBlockType } from '@/payload-types'

import styles from './Faq.module.css'

/** Henter de valgte spørsmålene og beholder redaktørens rekkefølge. */
async function resolveFaqs(block: FaqBlockType): Promise<Faq[]> {
  const ids = (block.faqs ?? []).map((f) => (typeof f === 'number' ? f : f.id))
  if (ids.length === 0) return []

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'faqs',
    where: { id: { in: ids } },
    limit: ids.length,
  })
  return ids
    .map((id) => result.docs.find((doc) => doc.id === id))
    .filter((doc): doc is Faq => Boolean(doc))
}

export async function FaqBlockComponent({ block }: { block: FaqBlockType }) {
  const faqs = await resolveFaqs(block)
  const items: AccordionItem[] = faqs.map((f) => ({ title: f.question, content: f.answer }))

  return (
    <section className={styles.section}>
      {block.title ? <h2>{block.title}</h2> : <div />}
      {items.length === 0 ? (
        <EmptyState title="Ingen spørsmål ennå.">
          Denne seksjonen fylles når spørsmål er lagt til.
        </EmptyState>
      ) : (
        <Accordion items={items} />
      )}
    </section>
  )
}
