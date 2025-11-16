import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import serverEntry from '../dist/server/server.js'

const STATIC_PATHS = new Set([
  '/favicon.ico',
  '/favicon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest',
])

const STATIC_EXTENSIONS = /\.(css|js|mjs|map|png|jpe?g|svg|ico|webmanifest|json|txt|woff2?|ttf)$/i

function wantsStaticAsset(pathname) {
  if (pathname === '/' || pathname === '') {
    return false
  }
  return pathname.startsWith('/assets/') || STATIC_PATHS.has(pathname) || STATIC_EXTENSIONS.test(pathname)
}

let parsedAssetManifest = null

async function maybeServeAsset(request, env, ctx) {
  if (env?.ASSETS) {
    const response = await env.ASSETS.fetch(request)
    if (response && response.status !== 404) {
      return response
    }
  }

  if (env?.__STATIC_CONTENT && env?.__STATIC_CONTENT_MANIFEST) {
    parsedAssetManifest =
      parsedAssetManifest ?? JSON.parse(env.__STATIC_CONTENT_MANIFEST)

    try {
      const eventLike = {
        request,
        waitUntil: (promise) => ctx.waitUntil(promise),
      }
      return await getAssetFromKV(eventLike, {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: parsedAssetManifest,
      })
    } catch (error) {
      console.error('Static asset error:', error)
    }
  }

  return null
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (wantsStaticAsset(url.pathname)) {
      const assetResponse = await maybeServeAsset(request, env, ctx)
      if (assetResponse) {
        return assetResponse
      }
    }

    return serverEntry.fetch(request, env, ctx)
  },
}
