import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
    };
});
