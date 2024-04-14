import { Chip, Stack } from '@mui/material';

import {
    formatRatingSystem,
    getMinRatingBoundary,
    getRatingBoundary,
    RatingSystem,
} from '../database/user';

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
            columnGap={1}
            rowGap={1}
            mb={2}
            flexWrap='wrap'
        >
            {Object.values(ratingSystems).map((rs) => (
                <Chip
                    key={rs}
                    label={`${getMinRatingBoundary(cohort, rs)}-${getRatingBoundary(cohort, rs)} ${formatRatingSystem(rs)}`}
                />
            ))}
        </Stack>
    );
};

export default GraduationChips;
