import EditGamePage from '@/games/edit/EditGamePage';

export default function Page({
    params: { cohort, id },
}: {
    params: { cohort: string; id: string };
}) {
    return <EditGamePage cohort={cohort} id={id} />;
}
