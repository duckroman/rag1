/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias['@/'] = require('path').join(__dirname, 'src/');
    return config;
  },
};

export default nextConfig;