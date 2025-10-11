module.exports = {
  transpilePackages: ['@/components', '@/lib'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
    }

    return config;
  },
};
