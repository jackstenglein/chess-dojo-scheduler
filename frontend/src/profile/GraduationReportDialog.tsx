import { Button } from '@mui/base';
import {
    Dialog,
    DialogActions,
    DialogContent,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import { SiTwitch, SiYoutube } from 'react-icons/si';
import { Graduation } from '../database/graduation';
import GraduationReport from '../graduation/GraduationReport';

function GraduationReportDialogInner({ graduation }: { graduation: Graduation }) {
    return (
        <Stack spacing={2}>
            <Typography variant='h4'>Congratulations!</Typography>
            <Typography variant='h6'>
                You have successfully graduated into the {graduation.newCohort} cohort.
            </Typography>
            <GraduationReport graduation={graduation} />
            <Typography variant='body1'>
                Invite your friends to tune in to the next grad show where your profile
                and games will be celebrated. Keep an eye on our{' '}
                <Link href='https://www.youtube.com/@ChessDojo'>
                    <SiYoutube />
                    Youtube
                </Link>{' '}
                and{' '}
                <Link href='https://www.twitch.tv/chessdojolive'>
                    <SiTwitch />
                    Twitch
                </Link>{' '}
                channels.
            </Typography>
        </Stack>
    );
}

interface GraduationReportDialogProps {
    open?: boolean;
    onClose?: () => void;
    inline?: boolean;
    graduation: Graduation;
}

export function GraduationReportDialog({
    open,
    onClose,
    graduation,
    inline,
}: GraduationReportDialogProps) {
    if (inline) {
        return <GraduationReportDialogInner graduation={graduation} />;
    }

    return (
        <Dialog open={open ?? false} onClose={() => onClose && onClose()} fullWidth>
            <DialogContent>
                <GraduationReportDialogInner graduation={graduation} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose && onClose()}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
