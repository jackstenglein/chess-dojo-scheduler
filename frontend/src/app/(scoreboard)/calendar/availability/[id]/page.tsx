import EventBooker from '@/components/calendar/booker/EventBooker';

export function generateStaticParams() {
    return [];
}

export default function Page({ params: { id } }: { params: { id: string } }) {
    return <EventBooker id={id} />;
}
