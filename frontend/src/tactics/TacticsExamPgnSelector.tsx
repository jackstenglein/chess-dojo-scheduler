import { Button, CardContent, Stack } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

const minuteSeconds = 60;
const hourSeconds = 3600;

const getTimeSeconds = (time: number) =>
    `0${(time % hourSeconds) % minuteSeconds | 0}`.slice(-2);
const getTimeMinutes = (time: number) => ((time % hourSeconds) / minuteSeconds) | 0;

const TacticsExamPgnSelector = () => {
    return (
        <CardContent>
            <Stack direction='row' alignItems='center'>
                <CountdownCircleTimer
                    isPlaying
                    size={120}
                    strokeWidth={6}
                    duration={3600}
                    colors={['#004777', '#F7B801', '#A30000', '#A30000']}
                    colorsTime={[7, 5, 2, 0]}
                    trailColor='rgba(0, 0, 0, 0)'
                >
                    {({ remainingTime, color }) => (
                        <span style={{ color }}>
                            <div>
                                {getTimeMinutes(remainingTime)}:
                                {getTimeSeconds(remainingTime)}
                            </div>
                        </span>
                    )}
                </CountdownCircleTimer>

                <Button variant='contained'>Finish Early</Button>
            </Stack>
        </CardContent>
    );
};

export default TacticsExamPgnSelector;
