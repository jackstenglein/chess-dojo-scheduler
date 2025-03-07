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

const { Custom, Custom2, Custom3, ...ratingSystems } = RatingSystem;

const GraduationChips: React.FC<GraduationChipsProps> = ({ cohort }) => {
    const ratingBoundary = getRatingBoundary(cohort, RatingSystem.Chesscom);

    if (!ratingBoundary) {
        return null;
    }

    return (
        <Stack direction='row' alignItems='center' columnGap={1} rowGap={1} mb={2} flexWrap='wrap'>
            {Object.values(ratingSystems).map((rs) => {
                let minRating = getMinRatingBoundary(cohort, rs);
                const maxRating = getRatingBoundary(cohort, rs);
                if (!maxRating) {
                    return null;
                }
                if (minRating === 0 && rs === RatingSystem.Fide) {
                    minRating = 1400;
                }

                return (
                    <Chip key={rs} label={`${minRating}-${maxRating} ${formatRatingSystem(rs)}`} />
                );
            })}
        </Stack>
    );
};

export default GraduationChips;
