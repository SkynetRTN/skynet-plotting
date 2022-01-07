// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  mount: {
    src: '/'
  },
  buildOptions: {
    out: 'dist',
  },
  alias: {
    "piexif-ts": "piexif-ts/dist/piexif.js",
  },
};
