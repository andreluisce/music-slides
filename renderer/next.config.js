const withTM = require('next-transpile-modules')(['@/components', '@/lib']);

module.exports = withTM({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
    }

    return config;
  },
});
