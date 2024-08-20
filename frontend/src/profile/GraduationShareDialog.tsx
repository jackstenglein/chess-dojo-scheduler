import GraduationCard from '@/components/graduations/GraduationCard';
import { Graduation } from '@/database/graduation';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
} from '@mui/material';

interface GraduationShareDialogProps {
    open: boolean;
    onClose: () => void;
    graduation: Graduation;
}

export default function GraduationShareDialog({
    open,
    onClose,
    graduation,
}: GraduationShareDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth>
            <DialogTitle>Share your progress!</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <DialogContentText>
                        Show off your hard work and welcome the world to the Dojo!
                        Download this image and share on social media.
                    </DialogContentText>
                    <GraduationCard graduation={graduation} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
