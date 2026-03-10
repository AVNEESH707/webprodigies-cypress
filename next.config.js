/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['fmliqecnrxgzwvucipeu.supabase.co'],
  },
  eslint: {
    ignoreDuringBuilds: true,
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
};

module.exports = nextConfig;
