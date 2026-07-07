// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.tsnsmp.online',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
