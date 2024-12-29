import YearReviewPage from './YearReviewPage';

export function generateStaticParams() {
    return [{ year: '2023' }, { year: '2024' }];
}

export default function Page({ params }: { params: { username: string; year: string } }) {
    return <YearReviewPage {...params} />;
}
