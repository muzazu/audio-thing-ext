/**
 * Reference: https://wxt.dev/guide/essentials/unit-testing.html
 */

import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
