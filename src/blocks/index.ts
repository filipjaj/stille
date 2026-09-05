import type { Block } from 'payload'

import { HeroBlock } from './Hero'
import { ProductsBlock } from './Products'
import { RichTextBlock } from './RichText'
import { ImageTextBlock } from './ImageText'
import { QuoteBlock } from './Quote'
import { GalleryBlock } from './Gallery'
import { FaqBlock } from './Faq'
import { NewsletterBlock } from './Newsletter'
import { ArticleTeaserBlock } from './ArticleTeaser'

export {
  HeroBlock,
  ProductsBlock,
  RichTextBlock,
  ImageTextBlock,
  QuoteBlock,
  GalleryBlock,
  FaqBlock,
  NewsletterBlock,
  ArticleTeaserBlock,
}

/** Alle blokktyper som kan brukes i `pages.layout`. */
export const blocks: Block[] = [
  HeroBlock,
  ProductsBlock,
  RichTextBlock,
  ImageTextBlock,
  QuoteBlock,
  GalleryBlock,
  FaqBlock,
  NewsletterBlock,
  ArticleTeaserBlock,
]
