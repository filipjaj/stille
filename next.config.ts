import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * Én worker under bygg.
   *
   * Next samler sidedata i parallelle prosesser. Hver av dem starter sin egen
   * workerd mot den samme lokale D1-fila, og de låser hverandre ute:
   * «SQLITE_BUSY: database is locked». Bygget blir noe tregere av å
   * serialisere, men det er forskjellen på at det virker og at det ikke gjør
   * det — i CI og i Cloudflares deploy-flyt like mye som lokalt.
   */
  experimental: {
    cpus: 1,
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],

  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
