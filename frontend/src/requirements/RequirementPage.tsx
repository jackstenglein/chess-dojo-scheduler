import { Container } from '@mui/material';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';
import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { Requirement } from '../database/requirement';
import LoadingPage from '../loading/LoadingPage';
import RequirementDisplay from './RequirementDisplay';

const RequirementPage = () => {
    const { id } = useParams();
    const api = useApi();
    const request = useRequest<Requirement>();

    useEffect(() => {
        if (id && !request.isSent()) {
            request.onStart();
            api.getRequirement(id)
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [api, id, request]);

    const requirement = request.data;

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (!requirement) {
        return <NotFoundPage />;
    }

    console.log(requirement);

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <RequirementDisplay requirement={requirement} />
        </Container>
    );
};

export default RequirementPage;
