/** @type {import('next').NextConfig} */
const nextConfig = {
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
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                ],
            },
            {
                source: '/engine/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=2592000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
