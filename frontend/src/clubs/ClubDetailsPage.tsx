import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Link,
    Snackbar,
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
import ClubJoinRequestDialog from './ClubJoinRequestDialog';
import { ClubDetails } from '../database/club';
import JoinRequestsTab from './JoinRequestsTab';

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
    const [showJoinRequestDialog, setShowJoinRequestDialog] = useState(false);
    const [snackbarText, setSnackbarText] = useState('');

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
    const isOwner = Boolean(viewer?.username && club?.owner === viewer.username);
    const isMember = Boolean(viewer?.username && club?.members[viewer.username]);
    const hasSentJoinRequest = Boolean(
        viewer?.username && club?.joinRequests[viewer.username]
    );

    const onJoinClub = () => {
        if (!viewer) {
            navigate('/signin');
        }
        if (club?.approvalRequired) {
            setShowJoinRequestDialog(true);
        }
    };

    const onSuccessfulJoinRequest = (club: ClubDetails) => {
        request.onSuccess({ ...request.data, club });
        setShowJoinRequestDialog(false);
    };

    const onProcessRequest = (club: ClubDetails, snackbarText: string) => {
        request.onSuccess({ ...request.data, club });
        setSnackbarText(snackbarText);
    };

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <RequestSnackbar request={request} />

            <Snackbar
                open={Boolean(snackbarText)}
                autoHideDuration={5000}
                onClose={() => setSnackbarText('')}
                message={snackbarText}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

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
                                    {isOwner ? (
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
                                    ) : hasSentJoinRequest ? (
                                        <Button variant='contained' disabled>
                                            Join Request Pending
                                        </Button>
                                    ) : (
                                        <Button variant='contained' onClick={onJoinClub}>
                                            {club.approvalRequired
                                                ? 'Request to Join Club'
                                                : 'Join Club'}
                                        </Button>
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
                                        {isOwner && club.approvalRequired && (
                                            <Tab
                                                label='Join Requests'
                                                value='joinRequests'
                                            />
                                        )}
                                    </Tabs>
                                </Box>
                            </Stack>

                            <TabPanel value='joinRequests'>
                                <JoinRequestsTab
                                    club={club}
                                    onProcessRequest={onProcessRequest}
                                />
                            </TabPanel>
                        </Container>

                        <TabPanel
                            value='scoreboard'
                            sx={{ width: 1, px: { xs: 0, sm: 3 } }}
                        >
                            <ScoreboardTab data={request.data!.scoreboard} />
                        </TabPanel>
                    </TabContext>

                    <ClubJoinRequestDialog
                        clubId={club.id}
                        clubName={club.name}
                        open={showJoinRequestDialog}
                        onSuccess={onSuccessfulJoinRequest}
                        onClose={() => setShowJoinRequestDialog(false)}
                    />
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
