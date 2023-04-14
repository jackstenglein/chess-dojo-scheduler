import { Stack, Typography, Chip } from '@mui/material';

import { RatingSystem, formatRatingSystem, ratingBoundaries } from '../database/user';

interface GraduationChipsProps {
    cohort: string;
}

const GraduationChips: React.FC<GraduationChipsProps> = ({ cohort }) => {
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

            {Object.values(RatingSystem).map((rs) => (
                <Chip
                    key={rs}
                    label={`${ratingBoundaries[cohort][rs]} ${formatRatingSystem(rs)}`}
                />
            ))}
        </Stack>
    );
};

export default GraduationChips;
