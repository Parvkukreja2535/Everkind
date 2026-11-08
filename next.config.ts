import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // CVs and documents (up to 4 MB; Vercel caps request bodies at 4.5 MB) go through server actions.
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  // Service and category images uploaded in the admin dashboard are served from Supabase Storage.
  images: supabaseHost ? { remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] } : undefined,
};

export default nextConfig;
