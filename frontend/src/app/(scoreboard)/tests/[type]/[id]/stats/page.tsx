import { ExamType } from '@/database/exam';
import { AdminStatsPage } from './AdminStatsPage';

export default function Page({ params: { type, id } }: { params: { type: ExamType; id: string } }) {
    return <AdminStatsPage type={type} id={id} />;
}
