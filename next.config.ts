import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase SSR compat
  serverExternalPackages: ['@supabase/supabase-js'],
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
};

export default nextConfig;
