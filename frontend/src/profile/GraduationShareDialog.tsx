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
        <Dialog open={open} fullWidth>
            <DialogTitle>Share your progress!</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <DialogContentText>
                        Show off the hard work you've done and welcome the world to the
                        dojo. Download this image and share on social media.
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
