import { Container, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { Graduation } from '../database/graduation';
import { SubscriptionStatus } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import UpsellAlert from '../upsell/UpsellAlert';

type GraduationPageParams = {};

const GraduationPage: React.FC<GraduationPageParams> = () => {
    const user = useAuth().user!;
    const isFreeTier = user.subscriptionStatus === SubscriptionStatus.FreeTier;

    const graduationsRequest = useRequest<Graduation[]>();
    const [graduations, setGraduations] = useState<Graduation[] | undefined>();
    const api = useApi();

    useEffect(() => {
        if (!graduationsRequest.isSent()) {
            graduationsRequest.onStart();
            api.listGraduationsByOwner(user.username)
                .then((graduations) => {
                    graduationsRequest.onSuccess(graduations);
                    setGraduations(graduations);
                })
                .catch((err) => {
                    console.error('listGraduations: ', err);
                    graduationsRequest.onFailure(err);
                });
        }
    }, []);

    if (graduationsRequest.isLoading() || graduations === undefined) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={graduationsRequest} />

            {isFreeTier && (
                <Stack alignItems='center' mb={3}>
                    <UpsellAlert>
                        Free-tier users are not able to access this feature.
                    </UpsellAlert>
                </Stack>
            )}
            {JSON.stringify(graduations, null, 2)}
        </Container>
    );
};

export default GraduationPage;
