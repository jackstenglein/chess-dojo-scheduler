import { listGraduationsByCohort } from '@/api/graduationApi';
import GraduationLinkCardGrid from '@/components/graduations/GraduationLinkCardGrid';

interface PageProps {
    params: {
        cohort: string;
    };
}

export default async function Page({ params }: PageProps) {
    const { cohort } = params;

    const graduations = await listGraduationsByCohort(cohort);

    return <GraduationLinkCardGrid graduations={graduations} />;
}
