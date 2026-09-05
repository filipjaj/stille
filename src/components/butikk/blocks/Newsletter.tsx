'use client'

import React from 'react'

import { Button } from '@/components/stille/Button'
import { Eyebrow } from '@/components/stille/Eyebrow'
import { Field } from '@/components/stille/Field'
import { Status } from '@/components/stille/Status'
import type { NewsletterBlock as NewsletterBlockType } from '@/payload-types'

import styles from './Newsletter.module.css'

/**
 * Nyhetsbrev-blokk. Datamodellen har ingen abonnent-collection eller
 * påmeldings-endepunkt (kun `newsletter`-globalen med tekstene) — skjemaet er
 * derfor visuelt korrekt, men bekrefter kun lokalt uten å lagre noe i
 * Payload. Se rapport.
 */
export function NewsletterBlockComponent({ block }: { block: NewsletterBlockType }) {
  const [sent, setSent] = React.useState(false)

  return (
    <section className={styles.section}>
      <div>
        {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
        <h2>{block.title}</h2>
      </div>

      {sent ? (
        <Status fixed={false}>Takk! Du er meldt på.</Status>
      ) : (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            setSent(true)
          }}
        >
          <div className={styles.field}>
            <Field
              inline
              label="E-post"
              placeholder="navn@eksempel.no"
              type="email"
              name="email"
              required
            />
          </div>
          <Button type="submit" variant="secondary">
            {block.buttonLabel}
          </Button>
        </form>
      )}
    </section>
  )
}
