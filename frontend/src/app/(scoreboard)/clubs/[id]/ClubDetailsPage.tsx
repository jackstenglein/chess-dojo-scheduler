'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { GetClubResponse } from '@/api/clubApi';
import { AuthStatus, useAuth, useFreeTier } from '@/auth/Auth';
import { LocationChip } from '@/components/clubs/LocationChip';
import { MemberCountChip } from '@/components/clubs/MemberCountChip';
import { UrlChip } from '@/components/clubs/UrlChip';
import { Link } from '@/components/navigation/Link';
import NewsfeedList from '@/components/newsfeed/NewsfeedList';
import { ClubDetails } from '@/database/club';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import { useRouter } from '@/hooks/useRouter';
import LoadingPage from '@/loading/LoadingPage';
import { ClubAvatar } from '@/profile/Avatar';
import UpsellDialog, { RestrictedAction } from '@/upsell/UpsellDialog';
import { LoadingButton, TabContext, TabPanel } from '@mui/lab';
import {
    Box,
    Button,
    Container,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Typography,
    useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ClubJoinRequestDialog } from './ClubJoinRequestDialog';
import { JoinRequestsTab } from './JoinRequestsTab';
import { LeaveClubDialog } from './LeaveClubDialog';
import { ScoreboardTab } from './ScoreboardTab';

export const ClubDetailsPage = ({ id }: { id: string }) => {
    const auth = useAuth();
    const viewer = auth.user;
    const api = useApi();
    const request = useRequest<GetClubResponse>();
    const joinRequest = useRequest();
    const { searchParams, setSearchParams } = useNextSearchParams({ view: 'scoreboard' });
    const [showJoinRequestDialog, setShowJoinRequestDialog] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [snackbarText, setSnackbarText] = useState('');
    const [upsellAction, setUpsellAction] = useState('');
    const isFreeTier = useFreeTier();
    const router = useRouter();

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
    const hasSentJoinRequest = Boolean(viewer?.username && club?.joinRequests[viewer.username]);

    const onProcessRequest = (data: GetClubResponse, snackbarText: string) => {
        request.onSuccess({
            club: data.club,
            scoreboard: [...(request.data?.scoreboard || []), ...(data.scoreboard || [])],
        });
        setSnackbarText(snackbarText);
    };

    const onJoinClub = () => {
        if (!viewer) {
            router.push('/signin');
        } else if (isFreeTier && !club?.allowFreeTier) {
            setUpsellAction(RestrictedAction.JoinSubscriberClubs);
        } else if (club?.approvalRequired) {
            setShowJoinRequestDialog(true);
        } else {
            joinRequest.onStart();
            api.joinClub(id || '')
                .then((resp) => {
                    onProcessRequest(resp.data, 'Joined club');
                    joinRequest.onSuccess();
                })
                .catch((err) => {
                    console.error('joinClub: ', err);
                    joinRequest.onFailure(err);
                });
        }
    };

    const onLeaveClub = () => {
        setShowLeaveDialog(true);
    };

    const onLeaveClubConfirm = (club: ClubDetails) => {
        if (request.data) {
            request.onSuccess({
                club,
                scoreboard: request.data.scoreboard?.filter((s) => s.username !== viewer?.username),
            });
        }
        setShowLeaveDialog(false);
    };

    const onSuccessfulJoinRequest = (club: ClubDetails) => {
        request.onSuccess({ ...request.data, club });
        setShowJoinRequestDialog(false);
    };

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={joinRequest} />

            <Snackbar
                open={Boolean(snackbarText)}
                autoHideDuration={5000}
                onClose={() => setSnackbarText('')}
                message={snackbarText}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />

            <UpsellDialog
                open={Boolean(upsellAction)}
                onClose={() => setUpsellAction('')}
                currentAction={upsellAction}
            />

            {club && (
                <Stack alignItems='center' width={1}>
                    <TabContext value={searchParams.get('view') || 'scoreboard'}>
                        <Container>
                            <Stack spacing={4}>
                                <Stack spacing={2}>
                                    <Stack
                                        direction='row'
                                        justifyContent='space-between'
                                        alignItems='center'
                                    >
                                        <Stack direction='row' alignItems='center' spacing={2}>
                                            <ClubAvatar club={club} />
                                            <Typography variant='h4'>{club.name}</Typography>
                                        </Stack>

                                        {auth.status === AuthStatus.Loading ? null : isOwner ? (
                                            <Button
                                                variant='contained'
                                                onClick={() =>
                                                    router.push(`/clubs/${club.id}/edit`)
                                                }
                                            >
                                                Edit Settings
                                            </Button>
                                        ) : isMember ? (
                                            <Button
                                                variant='contained'
                                                color='error'
                                                onClick={onLeaveClub}
                                            >
                                                Leave Club
                                            </Button>
                                        ) : hasSentJoinRequest ? (
                                            <Button variant='contained' disabled>
                                                Join Request Pending
                                            </Button>
                                        ) : (
                                            <LoadingButton
                                                variant='contained'
                                                onClick={onJoinClub}
                                                loading={joinRequest.isLoading()}
                                            >
                                                {club.approvalRequired
                                                    ? 'Request to Join Club'
                                                    : 'Join Club'}
                                            </LoadingButton>
                                        )}
                                    </Stack>

                                    <Stack direction='row' spacing={1} alignItems='center'>
                                        <MemberCountChip count={club.memberCount} />
                                        <LocationChip location={club.location} />
                                        <UrlChip url={club.externalUrl} />
                                    </Stack>
                                </Stack>

                                <Description description={club.description} />

                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <Tabs
                                        value={searchParams.get('view')}
                                        onChange={(_, t: string) =>
                                            setSearchParams({ view: t }, { scroll: false })
                                        }
                                        aria-label='profile tabs'
                                        variant='scrollable'
                                    >
                                        <Tab label='Scoreboard' value='scoreboard' />
                                        <Tab label='Newsfeed' value='newsfeed' />
                                        {isOwner && club.approvalRequired && (
                                            <Tab label='Join Requests' value='joinRequests' />
                                        )}
                                    </Tabs>
                                </Box>
                            </Stack>

                            <TabPanel value='newsfeed'>
                                <NewsfeedList initialNewsfeedIds={[club.id]} />
                            </TabPanel>

                            <TabPanel value='joinRequests'>
                                <JoinRequestsTab club={club} onProcessRequest={onProcessRequest} />
                            </TabPanel>
                        </Container>

                        {request.data?.scoreboard && (
                            <TabPanel value='scoreboard' sx={{ width: 1, px: { xs: 0, sm: 3 } }}>
                                <ScoreboardTab data={request.data.scoreboard} />
                            </TabPanel>
                        )}
                    </TabContext>

                    <ClubJoinRequestDialog
                        clubId={club.id}
                        clubName={club.name}
                        open={showJoinRequestDialog}
                        onSuccess={onSuccessfulJoinRequest}
                        onClose={() => setShowJoinRequestDialog(false)}
                    />

                    <LeaveClubDialog
                        clubId={club.id}
                        clubName={club.name}
                        approvalRequired={club.approvalRequired}
                        open={showLeaveDialog}
                        onSuccess={onLeaveClubConfirm}
                        onClose={() => setShowLeaveDialog(false)}
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
                        <Link href={props.href || ''} target='_blank' rel='noreferrer'>
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
