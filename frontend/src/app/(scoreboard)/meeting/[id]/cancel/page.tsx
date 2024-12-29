import { StripeCancelationPage } from './StripeCancelationPage';

export function generateStaticParams() {
    return [];
}

export default function Page({ params: { id } }: { params: { id: string } }) {
    return <StripeCancelationPage meetingId={id} />;
}
