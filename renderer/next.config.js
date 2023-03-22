const withVideos = require('next-videos')

const config = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer';
    }

    return config;
  },
};

module.exports = withVideos(config)