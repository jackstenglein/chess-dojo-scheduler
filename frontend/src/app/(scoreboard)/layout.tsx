import { Layout } from '@/legacy/Layout';
import WebVitals from '@/legacy/WebVitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <WebVitals />
            <Layout>{children}</Layout>
        </>
    );
}
