import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Receipt scanning loads WASM and worker files at runtime; bundling these
  // rewrites the paths they resolve against, so keep them external.
  serverExternalPackages: ['tesseract.js', 'pdf-parse', 'sharp'],
  // Add this 'images' block
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fake-storage.com', // The domain from your placeholder
        port: '',
        pathname: '/receipts/**', // Allow any path under /receipts/
      },
      // If you switch to a real service, add its config here
      // {
      //   protocol: 'https',
      //   hostname: 'your-s3-bucket-name.s3.amazonaws.com',
      // },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // The admin payment review previews PDF receipts in an <iframe>. The rule
      // above applies to every path, and X-Frame-Options: DENY blocks framing
      // even by the same site, so a PDF receipt renders as "refused to
      // connect". Uploaded files are relaxed to SAMEORIGIN: the app can frame
      // its own receipts, other sites still cannot. Listed after the catch-all
      // because a later matching rule overrides an earlier one for the same key.
      {
        source: '/api/uploads/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
