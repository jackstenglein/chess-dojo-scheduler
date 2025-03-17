import { ExamType } from '@/database/exam';
import { ExamPage } from './ExamPage';

export default function Page({ params: { type, id } }: { params: { type: ExamType; id: string } }) {
    return <ExamPage type={type} id={id} />;
}
