import { ClubScoreboardPage } from './ClubScoreboardPage';

export function generateStaticParams() {
    return [];
}

export default function Page({ params: { id } }: { params: { id: string } }) {
    return <ClubScoreboardPage id={id} />;
}
