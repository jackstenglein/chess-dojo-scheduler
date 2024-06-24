// NextJS dev server will not support direct URLs otherwise
const shouldBuildSPA = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: shouldBuildSPA ? 'export' : undefined,
    distDir: './build',
};

export default nextConfig;
