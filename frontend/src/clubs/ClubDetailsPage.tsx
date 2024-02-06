import { Container, Link, Stack, Typography, useTheme } from '@mui/material';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { ClubDetails } from '../database/club';
import { useParams } from 'react-router-dom';
import React, { useEffect } from 'react';
import LoadingPage from '../loading/LoadingPage';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ClubDetailsParams = {
    id: string;
};

const ClubDetailsPage = () => {
    const api = useApi();
    const { id } = useParams<ClubDetailsParams>();
    const request = useRequest<ClubDetails>();

    const reset = request.reset;
    useEffect(() => {
        if (id) {
            reset();
        }
    }, [id, reset]);

    useEffect(() => {
        if (id && !request.isSent()) {
            request.onStart();
            api.getClub(id)
                .then((resp) => {
                    console.log('getClub: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [id, request, api]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    const club = request.data;

    return (
        <Container sx={{ py: 4 }}>
            <RequestSnackbar request={request} />

            {club && (
                <Stack spacing={4}>
                    <Typography variant='h4'>{club.name}</Typography>
                    <Description description={club.description} />
                </Stack>
            )}
        </Container>
    );
};

const allowedElements = [
    'code',
    'p',
    'pre',
    'a',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'strong',
    'em',
    'del',
    'hr',
];

const Description: React.FC<{ description: string }> = ({ description }) => {
    const theme = useTheme();

    return (
        <div>
            <Markdown
                skipHtml
                remarkPlugins={[remarkGfm]}
                allowedElements={allowedElements}
                components={{
                    // code: (props) => <Typography>{props.children}</Typography>,
                    p: (props) => <Typography>{props.children}</Typography>,
                    pre: (props) => <>{props.children}</>,
                    a: (props) => (
                        <Link href={props.href} target='_blank' rel='noreferrer'>
                            {props.children}
                        </Link>
                    ),
                    blockquote: (props) => (
                        <blockquote
                            style={{
                                margin: '6px 10px',
                                borderLeft: `0.25em solid ${theme.palette.divider}`,
                                paddingLeft: '6px',
                            }}
                        >
                            {props.children}
                        </blockquote>
                    ),
                }}
            >
                {description}
            </Markdown>
        </div>
    );
};

export default ClubDetailsPage;
