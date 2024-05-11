import { Container, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { useApi } from '../api/Api';
import { useRequirements } from '../api/cache/requirements';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { Graduation } from '../database/graduation';
import { dojoCohorts, SubscriptionStatus } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import UpsellAlert from '../upsell/UpsellAlert';
import GraduationChips from './GraduationChips';
import Scoreboard from './Scoreboard';
import { ScoreboardRow } from './scoreboardData';
import ScoreboardTutorial from './ScoreboardTutorial';
import ScoreboardViewSelector from './ScoreboardViewSelector';

type ScoreboardPageParams = {
    type: string;
};

const ScoreboardPage = () => {
    const user = useAuth().user!;
    const isFreeTier = user.subscriptionStatus === SubscriptionStatus.FreeTier;
    const { type } = useParams<ScoreboardPageParams>();

    const dataRequest = useRequest<ScoreboardRow[]>();
    const graduationsRequest = useRequest<Graduation[]>();
    const api = useApi();
    const navigate = useNavigate();

    const { requirements, request: requirementRequest } = useRequirements(
        type || '',
        false,
    );

    useEffect(() => {
        if (type && !dataRequest.isSent()) {
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
    }, [type, dataRequest, api]);

    useEffect(() => {
        if (type && dojoCohorts.includes(type) && !graduationsRequest.isSent()) {
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

    useEffect(() => {
        if (type) {
            dataRequest.reset();
            graduationsRequest.reset();
        }
    }, [type]);

    const onChangeViewType = (type: string) => {
        navigate(`/scoreboard/${type}`);
    };

    if (!type) {
        return <Navigate to={`./${user.dojoCohort}`} replace />;
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

            <ScoreboardViewSelector value={type} onChange={onChangeViewType} />

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
};

export default ScoreboardPage;

const ScoreboardToolbar = () => {
    return (
        <Typography variant='caption' color='text.secondary' sx={{ ml: 0.5, mt: 0.5 }}>
            Tip: hold shift while scrolling to scroll horizontally
        </Typography>
    );
};
