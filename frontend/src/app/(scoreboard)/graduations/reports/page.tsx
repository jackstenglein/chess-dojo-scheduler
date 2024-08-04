import { listGraduationsByDate } from '@/api/graduationApi';
import GraduationReportsGrid from '@/components/graduations/GraduationReportsGrid';

export default async function Page() {
    const graduations = await listGraduationsByDate();

    return <GraduationReportsGrid graduations={graduations} />;
}
