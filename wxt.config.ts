import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Audio Thing Extension',
    description: 'A browser extension for audio processing.',
    homepage_url: 'https://github.com/muzazu/audio-thing-ext',
    permissions: ['storage', 'tabs', 'scripting'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    staged: {
      '*.{js,ts,tsx,vue,svelte}': 'vp check --fix',
    },
  }),
});
