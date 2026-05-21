/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { isServer }) => {
    // Ignore dev.ts and OpenTelemetry optional dependencies in production
    config.ignoreWarnings = [
      { module: /node_modules\/@opentelemetry\/sdk-node/ },
      { module: /node_modules\/require-in-the-middle/ },
      { module: /node_modules\/@genkit-ai\/core/ },
    ];
    
    // Exclude dev.ts from builds
    if (process.env.NODE_ENV === 'production') {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/ai/dev': false,
      };
    }
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)(?:[\\/]|$)/
              )?.[1];
              return `npm.${packageName?.replace('@', '')}`;
            },
            priority: 10,
          },
        },
      },
    };
    return config;
  },
  transpilePackages: ['@genkit-ai/ai', '@genkit-ai/core', '@genkit-ai/flow', '@genkit-ai/googleai'],
  experimental: {
    esmExternals: 'loose',
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@/components/ui'],
  },
}

module.exports = nextConfig
