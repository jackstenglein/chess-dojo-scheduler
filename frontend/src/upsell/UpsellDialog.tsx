import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

interface UpsellDialogProps {
    open: boolean;
    onClose: (value: boolean) => void;
}

const UpsellDialog: React.FC<UpsellDialogProps> = ({ open, onClose }) => {
    return (
        <Dialog
            data-cy='upsell-dialog'
            maxWidth='sm'
            fullWidth
            open={open}
            onClose={() => onClose(false)}
        >
            <DialogTitle>Upgrade to a Full Account</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Subscribe to the full training plan to:
                </DialogContentText>
                <DialogContentText component='div'>
                    <ul>
                        <li>Access all training plan tasks for all cohorts</li>
                        <li>Access all opening courses</li>
                        <li>Submit games to the Dojo Database</li>
                        <li>Get added to the Dojo Scoreboard</li>
                    </ul>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)}>Cancel</Button>
                <Button
                    href='https://www.chessdojo.club/plans-pricing'
                    target='_blank'
                    rel='noreferrer'
                >
                    View Prices
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UpsellDialog;
