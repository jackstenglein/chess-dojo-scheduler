import { GraduationLinkCard } from '@/components/graduations/GraduationLinkCard';
import { Graduation } from '@/database/graduation';
import { Grid } from '@mui/material';

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
        <Grid container spacing={2} alignItems='center' justifyContent='center'>
            {graduations.map((grad) => (
                <Grid
                    key={`${grad.username}//${grad.createdAt}`}
                    item
                    xs={8}
                    md={4}
                    xl={2}
                >
                    <GraduationLinkCard
                        graduation={grad}
                        to={`/graduations/reports/${grad.previousCohort}/${grad.username}`}
                    />
                </Grid>
            ))}
        </Grid>
    );
}
