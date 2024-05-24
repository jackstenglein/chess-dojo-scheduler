import { Container } from '@mui/material';
import { useEffect, useState } from 'react';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { Graduation } from '../database/graduation';
import LoadingPage from '../loading/LoadingPage';
import { GraduationReportDialog } from '../profile/GraduationReportDialog';

type GraduationPageParams = {};

const GraduationPage: React.FC<GraduationPageParams> = () => {
    const user = useAuth().user!;

    const graduationsRequest = useRequest<Graduation[]>();
    const [graduation, setGraduation] = useState<Graduation>();
    const api = useApi();

    useEffect(() => {
        if (!graduationsRequest.isSent()) {
            graduationsRequest.onStart();
            api.listGraduationsByOwner(user.username)
                .then((graduations) => {
                    graduationsRequest.onSuccess(graduations);
                    const [latest] = graduations.toSorted(
                        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
                    );
                    setGraduation(latest);
                })
                .catch((err) => {
                    console.error('listGraduations: ', err);
                    graduationsRequest.onFailure(err);
                });
        }
    }, []);

    if (graduationsRequest.isLoading() || graduation === undefined) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <GraduationReportDialog inline={true} graduation={graduation} />
            <RequestSnackbar request={graduationsRequest} />
        </Container>
    );
};

export default GraduationPage;
