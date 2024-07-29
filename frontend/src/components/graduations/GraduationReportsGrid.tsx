import { GraduationLinkCard } from '@/components/graduations/GraduationLinkCard';
import { Graduation } from '@/database/graduation';
import { Container } from '@mui/material';

interface GraduationReportsGridProps {
    graduations: Graduation[];
}

export default function GraduationReportsGrid({
    graduations,
}: GraduationReportsGridProps) {
    graduations.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            {graduations.map((grad) => (
                <GraduationLinkCard
                    key={`${grad.username}//${grad.createdAt}`}
                    graduation={grad}
                    to={`/graduations/reports/${grad.newCohort}/${grad.username}`}
                />
            ))}
        </Container>
    );
}
