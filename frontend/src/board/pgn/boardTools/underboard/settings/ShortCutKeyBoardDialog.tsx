
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ShortcutAction } from './ShortcutAction';
import KeyboardShortcuts from './KeyboardShortcuts';
import { BlockBoardKeyboardShortcuts } from '@/board/pgn/PgnBoard';

export interface DisplayKeyboardShortcutsDialogProps {
    /** Whether the dialog is open. */
    open: boolean;
    /** Callback to open/close the dialog. */
    setOpen: (open: boolean) => void;
    /** The actions to display. Defaults to all actions. that are optional */
    actions?: ShortcutAction[];
}

/**
 * A dialog that renders the full KeyboardShortcuts editor.
 * Accepts open/setOpen for controlled visibility and an optional actions
 * filter that is forwarded to KeyboardShortcuts
 */
const DisplayKeyboardShortcutsDialog = ({
    open,
    setOpen,
    actions,
}: DisplayKeyboardShortcutsDialogProps) => {
    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            className={BlockBoardKeyboardShortcuts}
            maxWidth='sm'
            fullWidth
        >
            <DialogTitle sx={{ pr: 6 }}>
                Keyboard Shortcuts
                <IconButton
                    aria-label='close'
                    onClick={() => setOpen(false)}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {/*
                 * KeyboardShortcuts owns all editing state (local-storage bindings,
                 * the key-capture dialog, etc.).  We just pass the optional actions
                 * filter and hide the redundant title inside the dialog by passing
                 * hideReset={false} — keep the reset button so the user can still
                 * reset from here.
                 */}
                <KeyboardShortcuts actions={actions} />
            </DialogContent>
        </Dialog>
    );
};

export default DisplayKeyboardShortcutsDialog;