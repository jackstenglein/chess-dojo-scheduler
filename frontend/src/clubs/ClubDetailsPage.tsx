import { useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Link,
    Stack,
    Tab,
    Tabs,
    Typography,
    useTheme,
} from '@mui/material';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TabContext, TabPanel } from '@mui/lab';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import LoadingPage from '../loading/LoadingPage';
import { useAuth } from '../auth/Auth';
import ScoreboardTab from './ScoreboardTab';
import { GetClubResponse } from '../api/clubApi';

export type ClubDetailsParams = {
    id: string;
};

const ClubDetailsPage = () => {
    const viewer = useAuth().user;
    const api = useApi();
    const { id } = useParams<ClubDetailsParams>();
    const request = useRequest<GetClubResponse>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams({ view: 'scoreboard' });

    const reset = request.reset;
    useEffect(() => {
        if (id) {
            reset();
        }
    }, [id, reset]);

    useEffect(() => {
        if (id && !request.isSent()) {
            request.onStart();
            api.getClub(id, true)
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

    const club = request.data?.club;

    const isMember = Boolean(viewer?.username && club?.members[viewer.username]);

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <RequestSnackbar request={request} />

            {club && (
                <Stack alignItems='center' width={1}>
                    <TabContext value={searchParams.get('view') || 'scoreboard'}>
                        <Container>
                            <Stack spacing={4}>
                                <Stack
                                    direction='row'
                                    justifyContent='space-between'
                                    alignItems='center'
                                >
                                    <Typography variant='h4'>{club.name}</Typography>
                                    {viewer?.username === club.owner ? (
                                        <Button
                                            variant='contained'
                                            onClick={() =>
                                                navigate(`/clubs/${club.id}/edit`)
                                            }
                                        >
                                            Edit Settings
                                        </Button>
                                    ) : isMember ? (
                                        <Button variant='contained'>Leave Club</Button>
                                    ) : (
                                        <Button variant='contained'>Join Club</Button>
                                    )}
                                </Stack>
                                <Description description={club.description} />

                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <Tabs
                                        value={searchParams.get('view')}
                                        onChange={(_, t) => setSearchParams({ view: t })}
                                        aria-label='profile tabs'
                                        variant='scrollable'
                                    >
                                        <Tab label='Scoreboard' value='scoreboard' />
                                    </Tabs>
                                </Box>
                            </Stack>
                        </Container>

                        <TabPanel
                            value='scoreboard'
                            sx={{ width: 1, px: { xs: 0, sm: 3 } }}
                        >
                            <ScoreboardTab data={request.data!.scoreboard} />
                        </TabPanel>
                    </TabContext>
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
