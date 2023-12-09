import { forwardRef } from 'react';
import { SchedulerHelpers } from '@aldabil/react-scheduler/types';
import {
    DialogTitle,
    DialogContent,
    Stack,
    Button,
    FormControlLabel,
    FormControl,
    Typography,
    Dialog,
    Slide,
    AppBar,
    Toolbar,
    RadioGroup,
    Radio,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { TransitionProps } from '@mui/material/transitions';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import { useCache } from '../../api/cache/Cache';
import { EventType, Event } from '../../database/event';
import { trackEvent, EventType as AnalyticsEventType } from '../../analytics/events';
import useEventEditor from './useEventEditor';
import AvailabilityEditor, { validateAvailabilityEditor } from './AvailabilityEditor';
import DojoEventEditor, { validateDojoEventEditor } from './DojoEventEditor';
import CoachingEditor, { validateCoachingEditor } from './CoachingEditor';

const Transition = forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction='up' ref={ref} {...props} />;
});

interface EventEditorProps {
    scheduler: SchedulerHelpers;
}

const EventEditor: React.FC<EventEditorProps> = ({ scheduler }) => {
    const originalEvent = scheduler.edited;
    const defaultStart = scheduler.state.start.value as Date;
    const defaultEnd = scheduler.state.end.value as Date;

    const api = useApi();
    const user = useAuth().user!;

    const cache = useCache();
    const request = useRequest();

    const editor = useEventEditor(defaultStart, defaultEnd, originalEvent?.event);

    const onSubmit = async () => {
        let event: Event | null = null;
        let errors: Record<string, string> = {};

        switch (editor.type) {
            case EventType.Availability:
                [event, errors] = validateAvailabilityEditor(user, originalEvent, editor);
                break;

            case EventType.Dojo:
                [event, errors] = validateDojoEventEditor(user, originalEvent, editor);
                break;

            case EventType.Coaching:
                [event, errors] = validateCoachingEditor(user, originalEvent, editor);
                break;
        }

        editor.setErrors(errors);
        if (Object.entries(errors).length > 0 || !event) {
            return;
        }

        request.onStart();
        try {
            scheduler.loading(true);
            const response = await api.setEvent(event);
            console.log('Got setEvent response: ', response);
            const newEvent = response.data;

            trackEvent(AnalyticsEventType.SetAvailability, {
                availability_id: newEvent.id,
                type: newEvent.type,
                title: newEvent.title,
                availability_types: newEvent.types,
                availability_cohorts: newEvent.cohorts,
                max_participants: newEvent.maxParticipants,
            });
            cache.events.put(newEvent);
            request.onSuccess();
            scheduler.close();
        } catch (err) {
            console.error(err);
            request.onFailure(err);
        } finally {
            scheduler.loading(false);
        }
    };

    return (
        <Dialog
            data-cy='event-editor'
            fullScreen
            open={true}
            TransitionComponent={Transition}
        >
            <RequestSnackbar request={request} />

            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <Typography
                        data-cy='event-editor-title'
                        sx={{ ml: 2, flex: 1 }}
                        variant='h6'
                        component='div'
                    >
                        Edit Event
                    </Typography>
                    <Button
                        data-cy='cancel-button'
                        color='inherit'
                        onClick={scheduler.close}
                        disabled={request.isLoading()}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        data-cy='save-button'
                        color='inherit'
                        loading={request.isLoading()}
                        onClick={onSubmit}
                    >
                        Save
                    </LoadingButton>
                </Toolbar>
            </AppBar>

            <DialogTitle data-cy='event-editor-date'>
                {defaultStart.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                })}
            </DialogTitle>

            <DialogContent>
                <Stack
                    spacing={4}
                    sx={{
                        mt: 4,
                    }}
                >
                    {(user.isAdmin || user.isCalendarAdmin || user.isCoach) && (
                        <Stack>
                            <Typography variant='h6'>Event Type</Typography>
                            <FormControl>
                                <RadioGroup
                                    value={editor.type}
                                    onChange={(e) =>
                                        editor.setType(e.target.value as EventType)
                                    }
                                >
                                    <FormControlLabel
                                        value={EventType.Availability}
                                        control={<Radio />}
                                        label='Bookable Availability'
                                    />
                                    {(user.isAdmin || user.isCalendarAdmin) && (
                                        <FormControlLabel
                                            value={EventType.Dojo}
                                            control={<Radio />}
                                            label='Dojo-Wide Event'
                                        />
                                    )}
                                    {user.isCoach && (
                                        <FormControlLabel
                                            value={EventType.Coaching}
                                            control={<Radio />}
                                            label='Coaching Session'
                                        />
                                    )}
                                </RadioGroup>
                            </FormControl>
                        </Stack>
                    )}

                    {editor.type === EventType.Availability && (
                        <AvailabilityEditor editor={editor} />
                    )}
                    {editor.type === EventType.Dojo && (
                        <DojoEventEditor editor={editor} />
                    )}
                    {editor.type === EventType.Coaching && (
                        <CoachingEditor editor={editor} />
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default EventEditor;
