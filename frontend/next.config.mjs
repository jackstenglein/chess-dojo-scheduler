/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // enable babel only for test https://nextjs.org/docs/messages/swc-disabled
        forceSwcTransforms: !process.env.INSTRUMENT_CODE,
    },
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
};

export default nextConfig;
