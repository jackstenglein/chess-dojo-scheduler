import { Stack, Typography, Chip } from '@mui/material';

import { RatingSystem, formatRatingSystem, getRatingBoundary } from '../database/user';

interface GraduationChipsProps {
    cohort: string;
}

const { Custom, ...ratingSystems } = RatingSystem;

const GraduationChips: React.FC<GraduationChipsProps> = ({ cohort }) => {
    const ratingBoundary = getRatingBoundary(cohort, RatingSystem.Fide);

    if (!ratingBoundary) {
        return null;
    }

    return (
        <Stack
            direction='row'
            alignItems='center'
            spacing={1}
            rowGap={1}
            mb={2}
            flexWrap='wrap'
        >
            <Typography>Graduation:</Typography>

            {Object.values(ratingSystems).map((rs) => (
                <Chip
                    key={rs}
                    label={`${getRatingBoundary(cohort, rs)} ${formatRatingSystem(rs)}`}
                />
            ))}
        </Stack>
    );
};

export default GraduationChips;
