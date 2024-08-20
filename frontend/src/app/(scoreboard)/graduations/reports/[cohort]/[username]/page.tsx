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

    graduations.filter((grad) => grad.username === username);

    if (graduations.length <= 0) {
        return notFound();
    }

    const gradSummary = graduations[0];

    return (
        <Container sx={{ py: 5 }}>
            <GraduationCard graduation={gradSummary} />
        </Container>
    );
}
