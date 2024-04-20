/// <reference types="vitest" />
import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
        build: {
            outDir: 'build',
        },
        server: {
            port: 3000,
        },
        define: {
            // https://github.com/aws-amplify/amplify-js/issues/11175
            global: {},
        },
        plugins: [react()],
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
