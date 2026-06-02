import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * In development: proxy /api/* to Python backend at localhost:8000.
 * In production (Vercel): Next.js API routes in app/api/ handle requests directly.
 */
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  async rewrites() {
    // Only proxy when running locally — API routes in app/api/ serve on Vercel
    if (!isDev) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
