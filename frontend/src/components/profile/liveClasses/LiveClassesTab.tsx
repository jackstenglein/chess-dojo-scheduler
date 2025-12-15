import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { Link } from '@/components/navigation/Link';
import { getConfig } from '@/config';
import { User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import { GameReviewCohort } from '@jackstenglein/chess-dojo-common/src/liveClasses/api';
import { Divider, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { GameReviewCohortQueue } from './GameReviewCohortQueue';

export function LiveClassesTab({ user }: { user: User }) {
    const api = useApi();
    const request = useRequest<GameReviewCohort>();

    useEffect(() => {
        if (!request.isSent() && user.gameReviewCohortId) {
            request.onStart();
            api.getGameReviewCohort({ id: user.gameReviewCohortId })
                .then((resp) => {
                    console.log(`getGameReviewCohort: `, resp.data);
                    request.onSuccess(resp.data.gameReviewCohort);
                })
                .catch((err: unknown) => {
                    console.error(`getGameReviewCohort: `, err);
                    request.onFailure(err);
                });
        }
    }, [request, user.gameReviewCohortId, api]);

    if (!user.gameReviewCohortId) {
        return (
            <Stack>
                <Typography>
                    This user has not been assigned to a Game & Profile Review cohort yet. Check
                    back later!
                </Typography>
            </Stack>
        );
    }

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (!request.data) {
        return <RequestSnackbar request={request} />;
    }

    const gameReviewCohort = request.data;
    const reviewQueue = Object.values(gameReviewCohort.members).sort((lhs, rhs) =>
        lhs.queueDate.localeCompare(rhs.queueDate),
    );

    return (
        <Stack>
            <Typography variant='h5'>Game & Profile Review — {gameReviewCohort.name}</Typography>
            <Divider />

            <Typography variant='h6' mt={2}>
                Discord
            </Typography>
            <Typography color='textSecondary'>
                Communicate with the other members of {gameReviewCohort.name} in Discord{' '}
                <Link
                    target='_blank'
                    href={`https://discord.com/channels/${getConfig().discord.guildId}/${gameReviewCohort.discordChannelId}`}
                >
                    here
                </Link>
                .
            </Typography>

            <Typography variant='h6' mt={2}>
                Classes
            </Typography>
            <Typography color='textSecondary'>
                The method of the Game & Profile Review class is simple. You will meet with your
                group weekly without the sensei. In this <b>peer review session</b>, you will review
                a game (or multiple games if there is time) from the user who is next up in the
                review queue. Try to improve the existing annotations of the game(s) and develop
                some questions about what was going on in the game(s). A few days later, you will
                meet with the sensei and cover the same user. Each <b>sensei session</b> will begin
                with a look at the user's profile. After that, the group will look at the game(s) of
                the user. The sensei will share their perspective on the game and answer the
                questions the students came up with during the peer review session. After the sensei
                session, the covered user moves to the bottom of the review queue and the process
                repeats for the next week.
            </Typography>

            <Typography variant='h6' mt={2}>
                Calendar
            </Typography>
            <Typography color='textSecondary'>
                You can find all the Game & Profile Review sessions (as well as the larger group
                classes) on the <Link href='/calendar'>calendar</Link>.
            </Typography>

            <Typography variant='h6' mt={2}>
                Recordings
            </Typography>
            <Typography color='textSecondary'>
                All classes are recorded. You can view the recordings{' '}
                <Link href='/material/live-classes'>here</Link>. Note that it may take a few hours
                after a class for the recording to be available.
            </Typography>

            <Typography variant='h6' mt={2}>
                Review Queue
            </Typography>
            <Typography color='textSecondary' mb={3}>
                Group members are listed in order of who is next up to have their game and profile
                reviewed.
            </Typography>

            {/* {reviewQueue.map((member) => (
                <Stack key={member.username} direction='row' alignItems='center'>
                    <Typography variant='h6' sx={{ mr: 2 }}>
                        1.
                    </Typography>
                    <Avatar username={member.username} displayName={member.displayName} size={30} />
                    <Link href={`/profile/${member.username}`} sx={{ ml: 1 }}>
                        {member.displayName}
                    </Link>
                </Stack>
            ))} */}
            <GameReviewCohortQueue
                gameReviewCohort={gameReviewCohort}
                setGameReviewCohort={request.onSuccess}
            />
        </Stack>
    );
}
