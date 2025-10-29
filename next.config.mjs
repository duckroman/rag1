import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  webpack: (config, { isServer }) => {
    config.resolve.alias['@/'] = path.join(__dirname, 'src/');
    return config;
  },
};

export default nextConfig;