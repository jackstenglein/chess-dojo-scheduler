import { ExamType } from '@/database/exam';
import { ExamInstructionsPage } from './(instructions)/ExamInstructionsPage';

export function generateStaticParams() {
    return [];
}

export default function Page({
    params: { type, id },
}: {
    params: { type: ExamType; id: string };
}) {
    return <ExamInstructionsPage type={type} id={id} />;
}
