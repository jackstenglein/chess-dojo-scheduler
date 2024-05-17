import { Container, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { Graduation } from '../database/graduation';
import { SubscriptionStatus } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import UpsellAlert from '../upsell/UpsellAlert';
import GraduationReport from './GraduationReport';

type GraduationPageParams = {};

// [ { "username": "google_100055839638141307370", "displayName": "Bestieboots Test", "type": "GRADUATION", "previousCohort": "600-700", "newCohort": "700-800", "score": 4, "ratingSystem": "CHESSCOM", "startRating": 936, "currentRating": 984, "comments": "test 123, hope this doesn't go out", "progress": { "114e4da1-6de1-41f8-9b16-11aa001fab3b": { "requirementId": "114e4da1-6de1-41f8-9b16-11aa001fab3b", "counts": { "600-700": 0 }, "minutesSpent": { "600-700": 0 }, "updatedAt": "2024-04-22T17:45:23Z" }, "4d23d689-1284-46e6-b2a2-4b4bfdc37174": { "requirementId": "4d23d689-1284-46e6-b2a2-4b4bfdc37174", "counts": { "600-700": 2 }, "minutesSpent": { "600-700": 0 }, "updatedAt": "2024-04-22T17:44:17Z" }, "79cb7fe2-7b33-4ebb-a3af-ccdf253c4d61": { "requirementId": "79cb7fe2-7b33-4ebb-a3af-ccdf253c4d61", "counts": { "ALL_COHORTS": 1 }, "minutesSpent": { "600-700": 0 }, "updatedAt": "2024-04-22T17:45:12Z" }, "df074603-53f6-4d46-bd64-a207e8a0e289": { "requirementId": "df074603-53f6-4d46-bd64-a207e8a0e289", "counts": { "600-700": 0 }, "minutesSpent": { "600-700": 0 }, "updatedAt": "2024-04-22T17:45:19Z" } }, "numberOfGraduations": 1, "graduationCohorts": [ "600-700" ], "startedAt": "2024-04-12T16:39:07Z", "createdAt": "2024-05-15T19:43:50Z" } ]
//

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
            <Stack alignItems='center' spacing={2}>
                {graduations.map((graduation) => (
                    <GraduationReport
                        key={`${graduation.username}-${graduation.createdAt}`}
                        graduation={graduation}
                    />
                ))}
            </Stack>
        </Container>
    );
};

export default GraduationPage;
