/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig(({ mode }) => {
    return {
        build: {
            outDir: 'build',
            sourcemap: mode === 'test',
        },
        server: {
            port: 3000,
        },
        define: {
            // https://github.com/aws-amplify/amplify-js/issues/11175
            global: {},
        },
        plugins: [
            react(),
            eslint({
                failOnError: false,
                include: 'src',
            }),
            ...(mode === 'test'
                ? [
                      istanbul({
                          cypress: true,
                          requireEnv: false,
                          forceBuildInstrument: true,
                          checkProd: true,
                      }),
                  ]
                : []),
        ],
        test: {
            environment: 'happy-dom',
            include: ['./src/**/*.test.ts', './src/**/*.test.tsx'],
            setupFiles: ['./src/setupTests.ts'],
            deps: {
                optimizer: {
                    web: {
                        enabled: true,
                        include: ['react-charts'],
                    },
                },
            },
        },
    };
});
