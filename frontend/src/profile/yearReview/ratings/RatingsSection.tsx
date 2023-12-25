import { Stack, Typography } from '@mui/material';

import { RatingSystem, formatRatingSystem } from '../../../database/user';
import { SectionProps } from '../YearReviewPage';
import { toDojoDateString } from '../../../calendar/displayDate';
import { useAuth } from '../../../auth/Auth';
import RatingCard from './RatingCard';
import { YearReviewRatingData } from '../../../database/yearReview';

function getDescription(
    system: RatingSystem,
    data: YearReviewRatingData,
    dojoMemberSince: string
): React.ReactNode {
    const current = data.currentRating.value;

    let preamble =
        dojoMemberSince !== ''
            ? `You've been a member of the Dojo since ${dojoMemberSince}. Since then, `
            : 'In the past year, ';
    preamble += `your ${formatRatingSystem(system)} rating `;

    let main;

    if (data.ratingChange === 0) {
        main = (
            <>
                remained the same, at{' '}
                <Typography component='span' fontWeight='800'>
                    {current}
                </Typography>
                . But next year will see some great growth!
            </>
        );
    } else if (data.ratingChange > 0) {
        main = (
            <>
                increased from{' '}
                <Typography component='span' fontWeight='800'>
                    {data.startRating}
                </Typography>{' '}
                to{' '}
                <Typography component='span' fontWeight='800'>
                    {data.currentRating.value}
                </Typography>
                . That's{' '}
                <Typography component='span' fontWeight='800'>
                    {data.ratingChange}
                </Typography>{' '}
                points! Keep up the great work next year!
            </>
        );
    } else {
        main = (
            <>
                decreased from{' '}
                <Typography component='span' fontWeight='800'>
                    {data.startRating}
                </Typography>{' '}
                to{' '}
                <Typography component='span' fontWeight='800'>
                    {data.currentRating.value}
                </Typography>
                . Don't worry - you'll come back stronger next year!
            </>
        );
    }

    return (
        <>
            {preamble}
            {main}
        </>
    );
}

const RatingsSection: React.FC<SectionProps> = ({ review }) => {
    const viewer = useAuth().user;
    const dark = !viewer?.enableLightMode;

    const [preferredRatingSystem, preferredRatingData] = Object.entries(
        review.ratings
    ).filter((data) => data[1].isPreferred)[0];

    const customRatingData = Object.entries(review.ratings).filter(
        (data) => data[0] === RatingSystem.Custom
    )[0][1];

    const userJoinedAt = review.userJoinedAt;
    let dojoMemberSince = '';

    if (userJoinedAt && userJoinedAt > '2023-01-01') {
        dojoMemberSince = `${toDojoDateString(
            new Date(userJoinedAt),
            viewer?.timezoneOverride
        )}.`;
    }

    return (
        <Stack alignItems='center'>
            <Typography
                variant='h6'
                fontWeight='800'
                fontSize='clamp(16px,3vw,32px)'
                textAlign='center'
            >
                Let's start with your results...
            </Typography>

            <Typography my={5} fontSize='clamp(16px,18px,30px)' textAlign='center'>
                {getDescription(
                    preferredRatingSystem as RatingSystem,
                    preferredRatingData,
                    dojoMemberSince
                )}
            </Typography>

            <RatingCard
                cohort={review.currentCohort}
                system={preferredRatingSystem as RatingSystem}
                data={preferredRatingData}
                dark={dark}
            />

            <Typography my={5} fontSize='clamp(16px,18px,30px)' textAlign='center'>
                Now let's see how your other ratings did...
            </Typography>

            <Stack width={1} spacing={5}>
                {Object.entries(review.ratings).map(([system, data]) => {
                    if (
                        system === preferredRatingSystem ||
                        system === RatingSystem.Custom
                    ) {
                        return null;
                    }
                    return (
                        <RatingCard
                            key={system}
                            cohort={review.currentCohort}
                            system={system as RatingSystem}
                            data={data}
                            dark={dark}
                        />
                    );
                })}

                <RatingCard
                    cohort={review.currentCohort}
                    system={RatingSystem.Custom}
                    data={customRatingData}
                    dark={dark}
                />
            </Stack>
        </Stack>
    );
};

export default RatingsSection;
