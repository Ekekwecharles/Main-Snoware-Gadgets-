import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    qualities: [75, 90],
  },
  serverExternalPackages: ["cloudinary", "@neondatabase/serverless", "ws"],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async redirects() {
    return [
      {
        // Old Vercel address → the shop's own domain, so links and search results move over.
        // /api stays put: APKs built before the switch and Paystack webhooks still call it there.
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "main-snoware-gadgets.vercel.app" }],
        destination: "https://www.snowaregadgets.com/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
