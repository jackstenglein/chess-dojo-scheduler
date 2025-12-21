import { Button, ButtonProps } from '@mui/material';
import { useState } from 'react';
import UpsellDialog, { UpsellDialogProps } from './UpsellDialog';

/**
 * Renders a button which when clicked, opens an upsell dialog.
 */
export function UpsellButton({
    buttonProps,
    dialogProps,
}: {
    buttonProps: ButtonProps;
    dialogProps: Partial<UpsellDialogProps>;
}) {
    const [showDialog, setShowDialog] = useState(false);

    return (
        <>
            <Button onClick={() => setShowDialog(true)} {...buttonProps} />
            <UpsellDialog open={showDialog} onClose={() => setShowDialog(false)} {...dialogProps} />
        </>
    );
}
