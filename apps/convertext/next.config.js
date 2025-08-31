/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@draft-gen/ui'],
  experimental: {
    externalDir: true,
  },
}

module.exports = nextConfig 