import type { NextConfig } from "next";

const nextConfig = {
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
};

export default nextConfig;
