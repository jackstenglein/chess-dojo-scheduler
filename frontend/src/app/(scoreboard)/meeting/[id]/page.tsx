import { MeetingPage } from './MeetingPage';

export function generateStaticParams() {
    return [];
}

export default function Page({ params: { id } }: { params: { id: string } }) {
    return <MeetingPage meetingId={id} />;
}
