import '@testing-library/jest-dom/vitest';

import { expect } from 'vitest';

vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation');
    return {
        ...actual,
        useRouter: vi.fn(() => ({
            push: vi.fn(),
        })),
        useSearchParams: vi.fn(() => ({
            get: vi.fn(),
        })),
        usePathname: vi.fn(),
    };
});

beforeEach(() => {
  vi.spyOn(console, 'warn').mockClear()
  vi.spyOn(console, 'error').mockClear()
})

afterEach(() => {
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
})
