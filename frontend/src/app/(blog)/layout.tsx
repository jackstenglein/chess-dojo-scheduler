import { Layout } from '@/legacy/Layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ChessDojo Blog',
    description: 'Covering all topics related to Chess training and improvement',
    keywords: ['Chess', 'Dojo', 'Training', 'Improvement'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <Layout>{children}</Layout>;
}
