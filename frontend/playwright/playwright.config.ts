import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
    path: [
        path.join(__dirname, '../.env.test.local'),
        path.join(__dirname, '../.env.local'),
        path.join(__dirname, '../.env'),
    ],
});

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './tests',
    testIgnore: ['**/*.test.ts', '**/node_modules/**'],
    timeout: 120000,
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,
    reporter: 'html',

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },

    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts$/ },
        {
            name: 'e2e',
            testMatch: /.*\.spec\.ts$/,
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
        cwd: path.join(__dirname, '..'),
    },
});
