// NextJS dev server will not support direct URLs otherwise
const shouldBuildSPA = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: shouldBuildSPA ? 'export' : undefined,
    distDir: './build',
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
        ],
    },
};

export default nextConfig;
