import { Layout } from '@/legacy/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ChessDojo',
    description:
        'View the scoreboard, schedule meetings and more for the ChessDojo Training Program',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <Layout>{children}</Layout>;
}
