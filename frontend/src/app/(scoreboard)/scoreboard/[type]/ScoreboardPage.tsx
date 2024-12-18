'use client';

import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useRequirements } from '@/api/cache/requirements';
import { AuthStatus, useAuth, useFreeTier } from '@/auth/Auth';
import ScoreboardViewSelector from '@/components/scoreboard/ScoreboardViewSelector';
import ScoreboardTutorial from '@/components/tutorial/ScoreboardTutorial';
import { Graduation } from '@/database/graduation';
import { dojoCohorts, User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import GraduationChips from '@/scoreboard/GraduationChips';
import Scoreboard from '@/scoreboard/Scoreboard';
import { ScoreboardRow } from '@/scoreboard/scoreboardData';
import UpsellAlert from '@/upsell/UpsellAlert';
import { Container, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ScoreboardPage({ type }: { type?: string }) {
    const { user, status } = useAuth();

    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }
    if (!user) {
        return <NotFoundPage />;
    }

    return <AuthScoreboardPage user={user} type={type} />;
}

function AuthScoreboardPage({ user, type }: { user: User; type?: string }) {
    const isFreeTier = useFreeTier();

    const dataRequest = useRequest<ScoreboardRow[]>();
    const graduationsRequest = useRequest<Graduation[]>();
    const api = useApi();
    const router = useRouter();

    const { requirements, request: requirementRequest } = useRequirements(
        type || '',
        false,
    );

    useEffect(() => {
        if (user && type && !dataRequest.isSent()) {
            dataRequest.onStart();
            api.getScoreboard(type)
                .then((data) => {
                    console.log('getScoreboard: ', data);
                    dataRequest.onSuccess(data);
                })
                .catch((err) => {
                    console.error('getScoreboard: ', err);
                    dataRequest.onFailure(err);
                });
        }
    }, [type, dataRequest, api, user]);

    useEffect(() => {
        if (user && type && dojoCohorts.includes(type) && !graduationsRequest.isSent()) {
            graduationsRequest.onStart();
            api.listGraduationsByCohort(type)
                .then((graduations) => {
                    graduationsRequest.onSuccess(graduations);
                })
                .catch((err) => {
                    console.error('listGraduations: ', err);
                    graduationsRequest.onFailure(err);
                });
        }
    });

    const dataReset = dataRequest.reset;
    const gradReset = graduationsRequest.reset;
    useEffect(() => {
        if (type) {
            dataReset();
            gradReset();
        }
    }, [type, dataReset, gradReset]);

    useEffect(() => {
        if (!type && user) {
            router.replace(`/scoreboard/${user.dojoCohort}`);
        }
    }, [user, type, router]);

    if (!type) {
        return null;
    }

    if (
        requirementRequest.isLoading() &&
        (requirements === undefined || requirements.length === 0)
    ) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={requirementRequest} />
            <RequestSnackbar request={dataRequest} />

            {isFreeTier && (
                <Stack alignItems='center' mb={3}>
                    <UpsellAlert>
                        Free-tier users are not displayed on the scoreboard. Upgrade to
                        get your account added.
                    </UpsellAlert>
                </Stack>
            )}

            <ScoreboardViewSelector value={type} />

            <GraduationChips cohort={type} />

            {dojoCohorts.includes(type) && (
                <Typography variant='h6'>Current Members</Typography>
            )}
            <Scoreboard
                cypressId='current-members-scoreboard'
                user={user}
                cohort={dojoCohorts.includes(type) ? type : undefined}
                requirements={requirements}
                rows={dataRequest.data ?? []}
                loading={dataRequest.isLoading()}
                addUser={type === 'following'}
                slots={{
                    toolbar: ScoreboardToolbar,
                }}
            />

            {dojoCohorts.includes(type) && (
                <>
                    <Typography variant='h6'>Graduations</Typography>
                    <div id='graduation-scoreboard'>
                        <Scoreboard
                            cypressId='graduates-scoreboard'
                            cohort={dojoCohorts.includes(type) ? type : undefined}
                            requirements={requirements}
                            rows={graduationsRequest.data ?? []}
                            loading={graduationsRequest.isLoading()}
                            slots={{
                                toolbar: ScoreboardToolbar,
                            }}
                        />
                    </div>
                </>
            )}

            <ScoreboardTutorial />
        </Container>
    );
}

const ScoreboardToolbar = () => {
    return (
        <Typography variant='caption' color='text.secondary' sx={{ ml: 0.5, mt: 0.5 }}>
            Tip: hold shift while scrolling to scroll horizontally
        </Typography>
    );
};
