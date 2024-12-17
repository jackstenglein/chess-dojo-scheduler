import GamePage from '@/games/view/GamePage';

export function generateStaticParams() {
    return [];
}

export default function Page({
    params: { cohort, id },
}: {
    params: { cohort: string; id: string };
}) {
    return <GamePage cohort={cohort} id={id} />;
}
