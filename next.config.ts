import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    '*.replit.dev',
    '*.janeway.replit.dev',
    '*.spock.replit.dev',
    'localhost',
    '127.0.0.1',
    process.env.REPLIT_DOMAINS || '',
  ].filter(Boolean),
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src/app', 'src/components', 'src/lib', 'src/hooks'],
  },
  serverExternalPackages: ['mongoose', 'bcryptjs'],
  productionBrowserSourceMaps: false,
  devIndicators: {
    position: 'bottom-right',
  },
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === 'development' ? ['*'] : [],
    },
    serverSourceMaps: false,
    webpackMemoryOptimizations: true,
    optimizePackageImports: ['antd', '@ant-design/icons', 'date-fns', 'react-bootstrap'],
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    
    if (isServer) {
      config.externals.push('mongoose', 'bcryptjs', '@node-rs/bcrypt');
    }
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
