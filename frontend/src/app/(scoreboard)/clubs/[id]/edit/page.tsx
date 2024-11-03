import { CreateClubPage } from '@/components/clubs/CreateClubPage';

export default function Page({ params: { id } }: { params: { id: string } }) {
    return <CreateClubPage id={id} />;
}
