import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: resolve(projectRoot, 'node_modules/react'),
      'react-dom': resolve(projectRoot, 'node_modules/react-dom'),
      'lucide-react': resolve(projectRoot, 'node_modules/lucide-react'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    env: {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
      NEXT_PUBLIC_API_GATEWAY_URL: 'http://localhost:3001',
    },
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/app/layout.tsx', 'src/app/**/page.tsx'],
    },
  },
});
