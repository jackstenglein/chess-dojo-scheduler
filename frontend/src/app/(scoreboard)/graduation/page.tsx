import { listGraduationsByDate } from '@/api/graduationApi';
import GraduationReportsGrid from '@/graduation/RecentGraduationReports';

export default async function Page() {
    const graduations = await listGraduationsByDate();

    return <GraduationReportsGrid graduations={graduations} />;
}
