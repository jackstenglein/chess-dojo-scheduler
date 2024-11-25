import { useAuth } from '@/auth/Auth';
import { User } from '@/database/user';
import { useLightMode } from '@/style/useLightMode';
import { WeekDays } from '@aldabil/react-scheduler/views/Month';
import { Close } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useTimeline } from '../activity/useTimeline';
import { getActivity, getHeatmapExplain, openHeatmap, renderHeatmap } from './Heatmap';
import HeatmapSelector, { TimelineEntryField, View } from './HeatmapSelector';

/**
 * Renders a card showing the user's activity heatmap.
 * @param user The user whose activity will be displayed in the heatmap.
 */
export const ActivityCard = ({ user }: { user: User }) => {
    const [field, setField] = useLocalStorage<TimelineEntryField>(
        'activityHeatmap.field',
        'minutesSpent',
    );
    const [maxPointsCount, setMaxPointsCount] = useState<number>(1);
    const [maxHoursCount, setMaxHoursCount] = useState<number>(4 * 60);
    const { entries } = useTimeline(user.username);
    const isLight = useLightMode();
    const { user: viewer } = useAuth();
    const [, setCalendarRef] = useState<HTMLElement | null>(null);
    const [weekStartOn] = useLocalStorage<WeekDays>('calendarFilters.weekStartOn', 0);
    const [view, setView] = useLocalStorage<View>('activityHeatmap.view', 'standard');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { activities, totalCount, maxCount } = useMemo(() => {
        return getActivity(
            entries,
            field,
            field === 'dojoPoints' ? maxPointsCount : maxHoursCount,
            viewer,
        );
    }, [field, entries, viewer, maxPointsCount, maxHoursCount]);

    useEffect(() => {
        const scroller = document.getElementsByClassName(
            'react-activity-calendar__scroll-container',
        )[0];
        if (scroller) {
            scroller.scrollLeft = scroller.scrollWidth;
        }
    });

    return (
        <Card>
            <CardHeader
                title={
                    <Stack>
                        <HeatmapSelector
                            field={field}
                            setField={setField}
                            maxPointsCount={maxPointsCount}
                            setMaxPointsCount={setMaxPointsCount}
                            maxHoursCount={maxHoursCount}
                            setMaxHoursCount={setMaxHoursCount}
                            view={view}
                            setView={setView}
                        />
                    </Stack>
                }
            />
            <CardContent
                sx={{
                    '& .react-activity-calendar__scroll-container': {
                        paddingTop: '1px',
                        paddingBottom: '10px',
                    },
                    '& .react-activity-calendar__footer': {
                        marginLeft: '0 !important',
                    },
                }}
            >
                {renderHeatmap(
                    setCalendarRef,
                    isLight,
                    activities,
                    view,
                    field,
                    maxPointsCount,
                    maxHoursCount,
                    totalCount,
                    maxCount,
                    weekStartOn,
                )}

                <Dialog
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    maxWidth={false}
                    sx={{
                        '& .MuiDialog-paper': {
                            backgroundColor: isLight ? '#b0d9f7' : '#000000',
                            color: '#fff',
                            height: view === 'standard' ? '65vh' : '50vh',
                            width: '120vw',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        },
                    }}
                >
                    <DialogTitle>
                        <HeatmapSelector
                            field={field}
                            setField={setField}
                            maxPointsCount={maxPointsCount}
                            setMaxPointsCount={setMaxPointsCount}
                            maxHoursCount={maxHoursCount}
                            setMaxHoursCount={setMaxHoursCount}
                            view={view}
                            setView={setView}
                        />
                        <IconButton
                            aria-label='close'
                            onClick={() => setIsModalOpen(false)}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <Close />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent
                        sx={{
                            padding: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            height: '100%',
                            width: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                transform: 'scale(1.8)',
                                transformOrigin: 'center',
                            }}
                        >
                            {renderHeatmap(
                                setCalendarRef,
                                isLight,
                                activities,
                                view,
                                field,
                                maxPointsCount,
                                maxHoursCount,
                                totalCount,
                                maxCount,
                                weekStartOn,
                            )}

                            {view === 'standard' ? (
                                getHeatmapExplain(false, setIsModalOpen)
                            ) : (
                                <Stack></Stack>
                            )}
                        </Box>
                    </DialogContent>
                </Dialog>

                {view === 'standard' ? (
                    getHeatmapExplain(true, setIsModalOpen)
                ) : (
                    <Stack>
                        <Stack direction='row' alignItems='center' columnGap={4}>
                            {openHeatmap(setIsModalOpen, 40)}
                        </Stack>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};
