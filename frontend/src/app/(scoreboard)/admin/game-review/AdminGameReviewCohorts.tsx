'use client';

import { listGameReviewCohorts, setGameReviewCohorts } from '@/api/liveClassesApi';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { getTimeZonedDate } from '@/components/calendar/displayDate';
import { Link } from '@/components/navigation/Link';
import { getConfig } from '@/config';
import { TimeFormat } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import Avatar from '@/profile/Avatar';
import { GameReviewCohort } from '@jackstenglein/chess-dojo-common/src/liveClasses/api';
import { Add } from '@mui/icons-material';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Menu,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers-pro';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { Frequency, RRule } from 'rrule';

interface EditableGameReviewCohort extends GameReviewCohort {
    editDiscordChannelId?: string;
    editPeerReviewTime?: DateTime | null;
    editPeerReviewGoogleMeetUrl?: string;
    editSenseiReviewTime?: DateTime | null;
    editSenseiReviewGoogleMeetUrl?: string;
}

export function AdminGameReviewCohorts() {
    const { user } = useAuth();
    const request = useRequest<GameReviewCohort[]>();
    const [editor, setEditor] = useState<EditableGameReviewCohort[]>([]);
    const [moving, setMoving] = useState<{
        anchorElement: HTMLElement;
        sourceIndex: number;
        member: string;
    }>();
    const [errors, setErrors] = useState<Record<number, Record<string, string>>>();
    const saveRequest = useRequest();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            listGameReviewCohorts()
                .then((resp) => {
                    request.onSuccess(resp.data.gameReviewCohorts);
                    setEditor(resp.data.gameReviewCohorts);
                })
                .catch((err) => request.onFailure(err));
        }
    }, [request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    const onChangeName = (i: number, name: string) => {
        setEditor((e) => [...e.slice(0, i), { ...e[i], name }, ...e.slice(i + 1)]);
    };

    const onChangeDiscordChannel = (i: number, value: string) => {
        setEditor((e) => [
            ...e.slice(0, i),
            { ...e[i], editDiscordChannelId: value },
            ...e.slice(i + 1),
        ]);
    };

    const onChangeTime = (i: number, type: 'peer' | 'sensei', value: DateTime | null) => {
        setEditor((e) => [
            ...e.slice(0, i),
            {
                ...e[i],
                editPeerReviewTime: type === 'peer' ? value : e[i].editPeerReviewTime,
                editSenseiReviewTime: type === 'sensei' ? value : e[i].editSenseiReviewTime,
            },
            ...e.slice(i + 1),
        ]);
    };

    const onChangeMeetUrl = (i: number, type: 'peer' | 'sensei', value: string) => {
        setEditor((e) => [
            ...e.slice(0, i),
            {
                ...e[i],
                editPeerReviewGoogleMeetUrl:
                    type === 'peer' ? value : e[i].editPeerReviewGoogleMeetUrl,
                editSenseiReviewGoogleMeetUrl:
                    type === 'sensei' ? value : e[i].editPeerReviewGoogleMeetUrl,
            },
            ...e.slice(i + 1),
        ]);
    };

    const onAddCohort = () => {
        setEditor((e) => [
            ...e,
            {
                type: 'GAME_REVIEW_COHORT',
                id: '',
                name: '',
                discordChannelId: '',
                peerReviewEventId: '',
                senseiReviewEventId: '',
                members: {},
            },
        ]);
    };

    const onStartMove = (e: React.MouseEvent<HTMLElement>, sourceIndex: number, member: string) => {
        setMoving({ anchorElement: e.currentTarget, sourceIndex, member });
    };

    const onFinishMove = (targetIndex: number) => {
        if (!moving) {
            return;
        }
        const newEditor = [...editor];
        const member = newEditor[moving.sourceIndex].members[moving.member];

        newEditor[targetIndex] = { ...newEditor[targetIndex] };
        newEditor[targetIndex].members[member.username] = member;
        newEditor[moving.sourceIndex] = {
            ...newEditor[moving.sourceIndex],
            members: Object.fromEntries(
                Object.entries(newEditor[moving.sourceIndex].members).filter(
                    (m) => m[0] !== member.username,
                ),
            ),
        };

        setEditor(newEditor);
        setMoving(undefined);
    };

    const onSave = () => {
        const newErrors: Record<number, Record<string, string>> = {};
        for (let i = 0; i < editor.length; i++) {
            if (Object.values(editor[i].members).length === 0) {
                continue;
            }

            if (editor[i].name.trim() === '') {
                newErrors[i] = { name: 'This field is required' };
            }

            if (!editor[i].peerReviewEventId && !editor[i].editPeerReviewTime) {
                newErrors[i] = { ...newErrors[i], peerReviewTime: 'This field is required' };
            }
            if (!editor[i].peerReviewEventId && !editor[i].editPeerReviewGoogleMeetUrl) {
                newErrors[i] = {
                    ...newErrors[i],
                    peerReviewGoogleMeetUrl: 'This field is required',
                };
            }

            if (!editor[i].senseiReviewEventId && !editor[i].editSenseiReviewTime) {
                newErrors[i] = { ...newErrors[i], senseiReviewTime: 'This field is required' };
            }
            if (!editor[i].senseiReviewEventId && !editor[i].editSenseiReviewGoogleMeetUrl) {
                newErrors[i] = {
                    ...newErrors[i],
                    senseiReviewGoogleMeetUrl: 'This field is required',
                };
            }
        }
        setErrors(newErrors);
        if (Object.values(newErrors).length) {
            return;
        }

        saveRequest.onStart();
        setGameReviewCohorts({
            gameReviewCohorts: editor.map((item) => ({
                ...item,
                discordChannelId: item.editDiscordChannelId || item.discordChannelId,
                peerReviewRrule: item.editPeerReviewTime
                    ? RRule.optionsToString({
                          freq: Frequency.WEEKLY,
                          dtstart: getTimeZonedDate(
                              item.editPeerReviewTime.toJSDate(),
                              user?.timezoneOverride,
                              'forward',
                          ),
                      })
                    : undefined,
                senseiReviewRrule: item.editSenseiReviewTime
                    ? RRule.optionsToString({
                          freq: Frequency.WEEKLY,
                          dtstart: getTimeZonedDate(
                              item.editSenseiReviewTime.toJSDate(),
                              user?.timezoneOverride,
                              'forward',
                          ),
                      })
                    : undefined,
            })),
        })
            .then((resp) => {
                request.onSuccess(resp.data.gameReviewCohorts);
                setEditor(resp.data.gameReviewCohorts);
                saveRequest.onSuccess();
            })
            .catch((err) => saveRequest.onFailure(err));
    };

    const onReset = () => {
        if (request.data) {
            setEditor(request.data);
        }
    };

    return (
        <Container sx={{ py: 5 }}>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={saveRequest} />

            <Stack spacing={2}>
                {editor.map((grc, i) => (
                    <Card
                        key={`${grc.id}-${i}`}
                        variant='outlined'
                        sx={{ borderColor: errors?.[i] ? 'error.main' : undefined }}
                    >
                        <CardHeader
                            title={
                                <TextField
                                    label='Name'
                                    variant='standard'
                                    value={grc.name}
                                    onChange={(e) => onChangeName(i, e.target.value)}
                                    error={!!errors?.[i]?.name}
                                    helperText={errors?.[i]?.name}
                                />
                            }
                        />
                        <CardContent>
                            <Stack>
                                {grc.discordChannelId ? (
                                    <Link
                                        href={`https://discord.com/channels/${getConfig().discord.guildId}/${grc.discordChannelId}`}
                                        target='_blank'
                                        rel='noopener'
                                    >
                                        Discord Channel
                                    </Link>
                                ) : (
                                    <TextField
                                        label='Discord Channel ID'
                                        value={grc.editDiscordChannelId || ''}
                                        onChange={(e) => onChangeDiscordChannel(i, e.target.value)}
                                        helperText='Leave blank to create a new channel'
                                    />
                                )}

                                {grc.peerReviewEventId ? (
                                    <Link
                                        href={`/meeting/${grc.peerReviewEventId}`}
                                        target='_blank'
                                    >
                                        Peer Review
                                    </Link>
                                ) : (
                                    <>
                                        <DateTimePicker
                                            value={grc.editPeerReviewTime || null}
                                            onChange={(value) => onChangeTime(i, 'peer', value)}
                                            label='Peer Review Time'
                                            slotProps={{
                                                textField: {
                                                    id: 'start-time',
                                                    fullWidth: true,
                                                    error: !!errors?.[i]?.peerReviewTime,
                                                    helperText:
                                                        errors?.[i]?.peerReviewTime ||
                                                        'The event will be repeated weekly at this time, starting on this date',
                                                },
                                            }}
                                            ampm={user?.timeFormat === TimeFormat.TwelveHour}
                                            sx={{ my: 3 }}
                                        />

                                        <TextField
                                            label='Peer Review Google Meet URL'
                                            value={grc.editPeerReviewGoogleMeetUrl || ''}
                                            onChange={(e) =>
                                                onChangeMeetUrl(i, 'peer', e.target.value)
                                            }
                                            helperText={errors?.[i]?.peerReviewGoogleMeetUrl}
                                            error={!!errors?.[i]?.peerReviewGoogleMeetUrl}
                                        />
                                    </>
                                )}

                                {grc.senseiReviewEventId ? (
                                    <Link
                                        href={`/meeting/${grc.senseiReviewEventId}`}
                                        target='_blank'
                                    >
                                        Sensei Review
                                    </Link>
                                ) : (
                                    <>
                                        <DateTimePicker
                                            value={grc.editSenseiReviewTime || null}
                                            onChange={(value) => onChangeTime(i, 'sensei', value)}
                                            label='Sensei Review Time'
                                            slotProps={{
                                                textField: {
                                                    id: 'start-time',
                                                    fullWidth: true,
                                                    error: !!errors?.[i]?.senseiReviewTime,
                                                    helperText:
                                                        errors?.[i]?.senseiReviewTime ||
                                                        'The event will be repeated weekly at this time, starting on this date',
                                                },
                                            }}
                                            ampm={user?.timeFormat === TimeFormat.TwelveHour}
                                            sx={{ my: 3 }}
                                        />
                                        <TextField
                                            label='Sensei Review Google Meet URL'
                                            value={grc.editSenseiReviewGoogleMeetUrl || ''}
                                            onChange={(e) =>
                                                onChangeMeetUrl(i, 'sensei', e.target.value)
                                            }
                                            helperText={errors?.[i]?.senseiReviewGoogleMeetUrl}
                                            error={!!errors?.[i]?.senseiReviewGoogleMeetUrl}
                                        />
                                    </>
                                )}
                            </Stack>

                            <Typography variant='h6' sx={{ mt: 3 }}>
                                Members
                            </Typography>
                            <Typography variant='subtitle1' color='textSecondary'>
                                Remove all members to delete this cohort
                            </Typography>
                            <Stack spacing={1} mt={1}>
                                {Object.values(grc.members).map((m) => (
                                    <Stack key={m.username} direction='row' alignItems='center'>
                                        <Avatar
                                            username={m.username}
                                            displayName={m.displayName}
                                            size={30}
                                        />
                                        <Link
                                            href={`/profile/${m.username}`}
                                            target='_blank'
                                            ml={1}
                                            mr={3}
                                        >
                                            {m.displayName}
                                        </Link>

                                        <Button
                                            variant='outlined'
                                            onClick={(e) => onStartMove(e, i, m.username)}
                                        >
                                            Move
                                        </Button>
                                    </Stack>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                ))}

                <Button onClick={onAddCohort} startIcon={<Add />} sx={{ alignSelf: 'start' }}>
                    Add Cohort
                </Button>

                <Stack direction='row' alignItems='center' gap={2}>
                    <Button onClick={onSave} variant='contained' loading={saveRequest.isLoading()}>
                        Save
                    </Button>

                    <Button
                        variant='outlined'
                        color='error'
                        onClick={onReset}
                        disabled={editor === request.data}
                    >
                        Reset Changes
                    </Button>

                    {Object.values(errors || {}).length > 0 && (
                        <Typography color='error'>
                            Failed to save. Fix the errors above and try again.
                        </Typography>
                    )}
                </Stack>

                <Menu
                    open={!!moving}
                    onClose={() => setMoving(undefined)}
                    anchorEl={moving?.anchorElement}
                >
                    <MenuItem>Unassigned</MenuItem>
                    {editor.map((grc, i) => (
                        <MenuItem
                            key={`${grc.id}-${i}`}
                            disabled={i === moving?.sourceIndex}
                            onClick={() => onFinishMove(i)}
                        >
                            {grc.name || 'Unnamed Cohort'}
                        </MenuItem>
                    ))}
                </Menu>
            </Stack>
        </Container>
    );
}
