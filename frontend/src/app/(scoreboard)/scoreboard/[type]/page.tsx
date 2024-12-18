import { dojoCohorts } from '@/database/user';
import { ScoreboardPage } from './ScoreboardPage';

export function generateStaticParams() {
    return dojoCohorts
        .map((cohort) => ({ type: cohort }))
        .concat({ type: 'dojo' }, { type: 'following' });
}

export default function Page({ params: { type } }: { params: { type: string } }) {
    return <ScoreboardPage type={type} />;
}
