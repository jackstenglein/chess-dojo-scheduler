import { NewsfeedDetail } from './NewsfeedDetail';

export function generateStaticParams() {
    return [];
}

export default function Page({ params: { owner, id } }: { params: { owner: string; id: string } }) {
    return <NewsfeedDetail owner={owner} id={id} />;
}
