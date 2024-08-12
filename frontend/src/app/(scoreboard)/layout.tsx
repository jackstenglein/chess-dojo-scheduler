import { UnauthenticatedLayout } from './UnauthenticatedLayout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <UnauthenticatedLayout>{children}</UnauthenticatedLayout>;
}
