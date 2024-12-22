import { compareCohorts } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Stack, Typography } from '@mui/material';
import { SectionProps } from './section';

const GraduationSection = ({ review }: SectionProps) => {
    if (!review.graduations || review.graduations.length === 0) {
        return null;
    }

    const count = review.graduations.length;
    const isPlural = count !== 1;

    const sorted = [...new Set(review.graduations)].sort(compareCohorts);

    return (
        <Stack alignItems='center'>
            <Typography
                variant='h6'
                fontWeight='800'
                fontSize='clamp(16px,3vw,32px)'
                textAlign='center'
            >
                In {review.period}, you graduated {count} time{isPlural ? 's' : ''}!
            </Typography>

            <Typography
                variant='h6'
                fontWeight='800'
                fontSize='clamp(14px,2vw,28px)'
                textAlign='center'
            >
                Congratulations on earning {isPlural ? 'these belts' : 'this belt'}!
            </Typography>

            <Stack
                direction='row'
                spacing={0.5}
                flexWrap='wrap'
                rowGap={1}
                justifyContent='center'
                mt={2}
            >
                {sorted.map((cohort) => (
                    <CohortIcon key={cohort} cohort={cohort} size={75} />
                ))}
            </Stack>
        </Stack>
    );
};

export default GraduationSection;
