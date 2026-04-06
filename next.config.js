const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Evita que Next.js confunda el workspace root con directorios padre
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  // Proxy API calls through Next.js to avoid cross-origin cookie issues on mobile (iOS Safari)
  // Falls back to localhost:3000 when NEXT_PUBLIC_API_GATEWAY_URL is not set (e.g. local builds)
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
      {
        source: '/api/media/:path*',
        destination: `${apiBase}/api/media/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${apiBase}/media/:path*`,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
    webpack: (config) => {
      // Resolución de fuente directa de origen-UXLibrary (sin build previo)
      config.resolve.alias['@ux-lib'] = path.join(__dirname, '../origen-UXLibrary/src');
      config.resolve.alias['@/components/ui/atoms'] = path.join(
        __dirname,
        '../origen-UXLibrary/src/compat/dashboard/atoms'
      );
      return config;
    },
};

module.exports = nextConfig;
