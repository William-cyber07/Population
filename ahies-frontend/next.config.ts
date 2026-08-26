// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the invalid 'turbo' experimental key entirely
  allowedDevOrigins: ['192.168.100.160'],
  // Increase the memory limit for Turbopack (This prevents the crash)
  experimental: {
    turbopack: {
      memoryLimit: 512 * 1024 * 1024, // 512 MB limit (adjust if needed)
    },
  },
};

module.exports = nextConfig;