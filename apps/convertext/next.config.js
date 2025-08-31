/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@draft-gen/ui'],
  experimental: {
    externalDir: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Optimize for App Router
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig 