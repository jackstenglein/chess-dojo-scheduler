import { ReactNode } from 'react';

export default function Layout({
    children,
    eventBooker,
}: {
    children: ReactNode;
    eventBooker: ReactNode;
}) {
    return (
        <>
            {children}
            {eventBooker}
        </>
    );
}
