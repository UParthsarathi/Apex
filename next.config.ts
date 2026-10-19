import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // lint is its own step (npm run lint), covering every folder
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // No remote image hosts: the app uses no next/image, and an allowlisted host lets anyone spend
  // this project's image-optimization quota through /_next/image.
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
