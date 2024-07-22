import { Layout } from '@/legacy/Layout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <Layout>{children}</Layout>;
}
