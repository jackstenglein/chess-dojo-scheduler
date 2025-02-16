import { NotificationPage } from './NotificationPage';

export function generateStaticParams() {
    return [];
}

export default function Page({ params: { id } }: { params: { id: string } }) {
    return <NotificationPage id={decodeURIComponent(id)} />;
}
