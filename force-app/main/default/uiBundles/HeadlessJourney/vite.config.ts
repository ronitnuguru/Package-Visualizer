import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import salesforce from '@salesforce/vite-plugin-ui-bundle';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      tailwindcss(),
      react(),
      salesforce(),
    ] as import('vite').PluginOption[],

    // Build configuration for MPA
    build: {
      outDir: resolve(__dirname, 'dist'),
      assetsDir: 'assets',
      sourcemap: true,
    },

    // Resolve aliases (shared between build and test)
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@styles': path.resolve(__dirname, './src/styles'),
      },
    },

    // Vitest configuration
    test: {
      // Override root for tests (build uses src/pages as root)
      root: resolve(__dirname),

      // Use jsdom environment for React component testing
      environment: 'jsdom',

      // Setup files to run before each test
      setupFiles: ['./src/test/setup.ts'],

      // Global test patterns
      include: [
        'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],

      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'clover', 'json'],
        exclude: [
          'node_modules/',
          'src/test/',
          'src/**/*.d.ts',
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/components/**/index.ts',
          '**/*.config.ts',
          'build/',
          'dist/',
          'coverage/',
          'eslint.config.js',
        ],
        thresholds: {
          global: {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85,
          },
        },
      },

      // Test timeout
      testTimeout: 10000,

      // Globals for easier testing
      globals: true,
    },
  };
});
