// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://tsnsmp.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
