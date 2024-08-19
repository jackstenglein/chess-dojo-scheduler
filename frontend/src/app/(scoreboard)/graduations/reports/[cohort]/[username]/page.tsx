import { listGraduationsByCohort } from '@/api/graduationApi';
import GraduationCard from '@/components/graduations/GraduationCard';
import { Container } from '@mui/material';
import { notFound } from 'next/navigation';

interface PageProps {
    params: {
        cohort: string;
        username: string;
    };
}

export default async function Page({ params }: PageProps) {
    const { username, cohort } = params;

    const graduations = await listGraduationsByCohort(cohort);

    const userGraduations = graduations.filter((grad) => grad.username === username);

    // A user may have graduated to the same cohort multiple times
    userGraduations.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (userGraduations.length <= 0) {
        return notFound();
    }

    const gradSummary = userGraduations[userGraduations.length - 1];

    return (
        <Container sx={{ py: 5 }}>
            <GraduationCard graduation={gradSummary} />
        </Container>
    );
}
