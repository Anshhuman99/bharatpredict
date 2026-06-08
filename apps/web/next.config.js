const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    domains: ['images.unsplash.com', 'assets.aceternity.com'],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
