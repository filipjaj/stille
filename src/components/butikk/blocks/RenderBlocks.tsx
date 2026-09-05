import type { Page } from '@/payload-types'

import { ArticleTeaserBlockComponent } from './ArticleTeaser'
import { FaqBlockComponent } from './Faq'
import { GalleryBlockComponent } from './Gallery'
import { HeroBlockComponent } from './Hero'
import { ImageTextBlockComponent } from './ImageText'
import { NewsletterBlockComponent } from './Newsletter'
import { ProductsBlockComponent } from './Products'
import { QuoteBlockComponent } from './Quote'
import { RichTextBlockComponent } from './RichText'

type LayoutBlock = NonNullable<Page['layout']>[number]

/**
 * Mapper `blockType` fra `pages.layout` til riktig komponent. En blokktype
 * som mangler i unionen (skulle ikke skje, `layout` er typet fra samme
 * `blocks`-array) hoppes stille over i stedet for å kaste.
 */
export function RenderBlocks({ blocks }: { blocks?: LayoutBlock[] | null }) {
  if (!blocks?.length) return null

  return (
    <>
      {blocks.map((block, index) => {
        const key = block.id ?? index
        switch (block.blockType) {
          case 'hero':
            return <HeroBlockComponent key={key} block={block} />
          case 'products':
            return <ProductsBlockComponent key={key} block={block} />
          case 'richText':
            return <RichTextBlockComponent key={key} block={block} />
          case 'imageText':
            return <ImageTextBlockComponent key={key} block={block} />
          case 'quote':
            return <QuoteBlockComponent key={key} block={block} />
          case 'gallery':
            return <GalleryBlockComponent key={key} block={block} />
          case 'faq':
            return <FaqBlockComponent key={key} block={block} />
          case 'newsletter':
            return <NewsletterBlockComponent key={key} block={block} />
          case 'articleTeaser':
            return <ArticleTeaserBlockComponent key={key} block={block} />
          default:
            return null
        }
      })}
    </>
  )
}
