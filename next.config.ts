import type { NextConfig } from "next";

let supabaseHostname: string | undefined;
const resolvedSupabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
if (resolvedSupabaseUrl) {
  try {
    supabaseHostname = new URL(resolvedSupabaseUrl).hostname;
  } catch {
    supabaseHostname = undefined;
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
