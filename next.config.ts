import type {NextConfig} from 'next';
import fs from 'fs';
import path from 'path';

console.log("=== Detecting Supabase Environment Variables ===");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (supabaseUrl && supabaseAnonKey) {
  console.log(`Supabase credentials found! URL length: ${supabaseUrl.length}, Anon Key length: ${supabaseAnonKey.length}`);
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const fileContent = `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey}"\n`;
  fs.writeFileSync(envLocalPath, fileContent);
  console.log(".env.local file has been successfully generated.");
} else {
  console.warn("Could not find Supabase credentials in process.env. Available keys containing 'SUPABASE':", 
    Object.keys(process.env).filter(k => k.toUpperCase().includes('SUPABASE'))
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
