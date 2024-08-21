import { listGraduationsByOwner } from '@/api/graduationApi';
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

    let graduations = await listGraduationsByOwner(username);

    graduations = graduations.filter((grad) => grad.previousCohort === cohort);

    if (graduations.length <= 0) {
        return notFound();
    }

    graduations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const gradSummary = graduations[0];

    return (
        <Container sx={{ py: 5 }}>
            <GraduationCard graduation={gradSummary} />
        </Container>
    );
}
