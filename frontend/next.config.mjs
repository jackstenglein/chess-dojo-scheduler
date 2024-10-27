/** @type {import('next').NextConfig} */
const nextConfig = {
    productionBrowserSourceMaps: process.env.ENABLE_SOURCE_MAPS === 'true',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'th.bing.com',
                pathname: '/th/id/R.aa96dba2d64d799f0d1c6a02e4acdebb',
            },
            {
                protocol: 'https',
                hostname: 'chess-dojo-images.s3.amazonaws.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '/jalpp/DojoIcons/**',
            },
        ],
    },
    headers() {
        const headers = [
            {
                source: '/:path*',
                headers: ENGINE_HEADERS,
            },
            {
                source: '/static/:path*',
                headers: ENGINE_HEADERS.concat({
                    key: 'Cache-Control',
                    value: 'public, max-age=2592000, immutable',
                }),
            },
        ];

        headers.push(
            ...pagesWithVideos.map((page) => ({
                source: page,
                headers: VIDEO_EMBED_HEADERS,
            })),
        );

        for (const page of coursePagesWithEngine) {
            for (const h of page.has ?? []) {
                headers.push({
                    source: `/courses/${page.type}/${page.id}`,
                    has: [
                        { type: 'query', key: 'chapter', value: h.chapters.join('|') },
                        { type: 'query', key: 'module', value: h.modules.join('|') },
                    ],
                    headers: ENGINE_HEADERS,
                });
            }

            if (page.missing) {
                headers.push({
                    source: `/courses/${page.type}/${page.id}`,
                    missing: page.missing,
                    headers: ENGINE_HEADERS,
                });
            }
        }

        return headers;
    },
};

const ENGINE_HEADERS = [
    {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'require-corp',
    },
    {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
    },
];

const VIDEO_EMBED_HEADERS = [
    {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'unsafe-none',
    },
];

const pagesWithVideos = [
    '/',
    '/profile',
    '/scoreboard/:path*',
    '/courses/:path*',
    '/blog/olympiad-2024',
    '/blog/new-ratings',
    '/blog/dojo-talks/top-10-2025',
];

const coursePagesWithEngine = [
    {
        type: 'ENDGAME',
        id: '34241b4d-3a8f-4d5f-9a15-b26cf718a0d0',
        has: [
            {
                chapters: ['1', '2', '6', '8', '9', '10', '11'],
                modules: ['0', '2'],
            },
            {
                chapters: ['3'],
                modules: ['0', '1'],
            },
            {
                chapters: ['4'],
                modules: ['0'],
            },
            {
                chapters: ['5', '7'],
                modules: ['0', '3'],
            },
        ],
    },
    {
        type: 'OPENING',
        id: '0e144cc9-be12-48f2-a3b0-92596fa2559d',
        has: [
            {
                chapters: ['0'],
                modules: ['1', '3'],
            },
        ],
    },
    {
        type: 'OPENING',
        id: '12d020c6-6d03-4b1f-9c01-566bffa3b23b',
        has: [
            {
                chapters: ['0'],
                modules: ['0', '1', '2', '3', '5', '6'],
            },
        ],
    },
    {
        type: 'OPENING',
        id: '12d020c6-6d03-4b1f-9c01-566bffa3b23b',
        missing: [
            { type: 'query', key: 'chapter' },
            { type: 'query', key: 'module' },
        ],
    },
    {
        type: 'OPENING',
        id: '37dd0c09-7622-4e87-b0df-7d3e6b37e410',
        has: [{ chapters: ['0'], modules: ['1', '3'] }],
    },
    {
        type: 'OPENING',
        id: 'b042a392-e285-4466-9bc0-deeecc2ce16c',
        has: [{ chapters: ['0'], modules: ['1', '3', '4'] }],
    },
    {
        type: 'OPENING',
        id: 'd30581c8-f2c4-4d1c-8a5e-f303a83cc193',
        has: [
            { chapters: ['0', '1', '2', '3', '4'], modules: ['1', '2'] },
            { chapters: ['5'], modules: ['0', '1'] },
        ],
    },
    {
        type: 'OPENING',
        id: '2402cb47-d65a-4914-bc11-8f60eb32e41a',
        has: [
            { chapters: ['0', '1', '2', '3', '5'], modules: ['1'] },
            { chapters: ['4', '6', '7'], modules: ['0'] },
        ],
    },
];

export default nextConfig;
