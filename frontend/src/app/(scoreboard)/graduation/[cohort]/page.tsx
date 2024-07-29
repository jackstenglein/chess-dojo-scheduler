import { listGraduationsByCohort } from '@/api/graduationApi';
import GraduationReportsGrid from '@/graduation/RecentGraduationReports';

interface PageProps {
    params: {
        cohort: string;
    };
}

export default async function Page({ params }: PageProps) {
    const { cohort } = params;

    const graduations = await listGraduationsByCohort(cohort);

    return <GraduationReportsGrid graduations={graduations} />;
}
