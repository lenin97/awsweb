/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.xxxxxxxxxxxx.amazonaws.com',
        pathname: '*************/**',
      },
      {
        protocol: 'https',
        hostname: process.env.TCV_CDN_DOMAIN,       // or your exact distro hostname
        pathname: '/*************/**',           // limit to your folder
      },
    ],
  },
  experimental: {
   // reactMaxHeaderLength: 16384, // if you still use <Image> with long URLs
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'amplify'], // Add 'amplify' here
  },
  // === Remove console.* calls from the client bundle in production ===
  // - Default: enabled in production and keeps `error` + `warn` so serious logs still appear.
  // - If you want to remove everything, set removeConsole: process.env.NODE_ENV === 'production'
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        //? { exclude: ['error', 'warn'] }
        //: false,
  },
};

module.exports = nextConfig;
