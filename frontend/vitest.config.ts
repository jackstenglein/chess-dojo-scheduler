import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        globals: true,
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
        coverage: {
            provider: "istanbul",
            include: "src/**"
        }
    },
});
