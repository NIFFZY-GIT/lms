import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
