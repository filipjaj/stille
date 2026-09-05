import type { Metadata } from 'next'
import React from 'react'

import { Button } from '@/components/stille/Button'

import { assumptions, blocks, collections, nextSteps, primaryLinks, screens } from './data'
import styles from './oversikt.module.css'

export const metadata: Metadata = {
  title: 'stille — oversikt',
  description:
    'Prototypeoversikt for Stille: tjuefire skjermer, Payload-datamodellen og de ni blokktypene.',
}

export default function OversiktPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.wordmark}>stille</span>
        <span className={styles.meta}>
          Nettbutikk + Payload CMS · prototype v1 · 5. sep 2026
        </span>
      </header>

      <section className={styles.intro}>
        <div>
          <span className="st-eyebrow">Første leveranse</span>
          <h1 className={styles.title}>
            Butikk, journal
            <br />
            <em>og redaktør.</em>
          </h1>
          <p className={styles.lede}>
            Tjuefire skjermer i åtte filer. Butikken finnes for mobil (390px), tablet (768px) og
            desktop (1440px) med editorial-flatene fremst; admin er desktop (1440px) i Stille-stil
            med et Payload-likt blokkskjema.
          </p>
          <div className={styles.actions}>
            {primaryLinks.map((link) => (
              <Button
                key={link.label}
                href={link.href}
                variant={link.variant}
                icon="arrow-right"
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </Button>
            ))}
          </div>
        </div>

        <div className={styles.assumptions}>
          <span className="st-eyebrow">Antakelser</span>
          <ul className={styles.assumptionsList}>
            {assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Skjermer</h2>
        <div className={styles.screens}>
          {screens.map((screen) => (
            <a
              key={screen.no}
              className={styles.screen}
              href={screen.href}
              target="_blank"
              rel="noreferrer"
            >
              <div className={styles.screenThumb}>{screen.no}</div>
              <div>
                <span className={styles.screenGroup}>{screen.group}</span>
                <span className={styles.screenTitle}>{screen.title}</span>
                <p className={styles.screenDesc}>{screen.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSpaced} ${styles.model}`}>
        <div>
          <h2 className={styles.sectionTitleTight}>Payload-datamodell</h2>
          <p className={styles.modelIntro}>
            Collections og globals slik prototypen forutsetter dem. Butikkflatene leser bare fra
            disse.
          </p>
          <div className={styles.hairline}>
            {collections.map((collection) => (
              <div key={collection.name} className={styles.row}>
                <span className={styles.rowName}>{collection.name}</span>
                <span className={styles.rowFields}>{collection.fields}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className={styles.sectionTitleTight}>Blokker (Pages)</h2>
          <p className={styles.modelIntro}>
            Ni blokktyper. Hver blokk har én butikk-visning i Stille; redaktøren ser bare felt.
          </p>
          <div className={styles.hairline}>
            {blocks.map((block) => (
              <div key={block.name} className={`${styles.row} ${styles.rowNarrow}`}>
                <span className={styles.rowName}>{block.name}</span>
                <span className={styles.rowFields}>{block.fields}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionSpaced}`}>
        <h2 className={styles.sectionTitleTight}>Neste steg</h2>
        <ul className={styles.nextList}>
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
