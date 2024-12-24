import '@testing-library/jest-dom/vitest';

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

beforeEach((context) => {
  ['warn', 'error'].forEach(method => {
    vi.spyOn(console, method).mockClear()
  })
})

afterEach((context) => {
  ['warn', 'error'].forEach(method => {
    expect(console[method]).not.toHaveBeenCalled()
  })
})
