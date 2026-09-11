const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: { document: '/offline' },
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/(uploads|images)\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'benidorah-media',
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'benidorah-api', networkTimeoutSeconds: 6 },
    },
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'benidorah-pages' },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, immutable' }],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
