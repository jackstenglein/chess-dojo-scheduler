import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
});
