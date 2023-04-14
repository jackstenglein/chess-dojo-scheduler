import React from 'react';
import { Dialog, DialogContent, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

import { Requirement } from '../database/requirement';
import RequirementDisplay from './RequirementDisplay';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction='up' ref={ref} {...props} />;
});

interface RequirementModalProps {
    open: boolean;
    onClose: () => void;
    requirement: Requirement;
}

const RequirementModal: React.FC<RequirementModalProps> = ({
    open,
    onClose,
    requirement,
}) => {
    return (
        <Dialog
            maxWidth='lg'
            fullWidth
            open={open}
            onClose={onClose}
            TransitionComponent={Transition}
        >
            <DialogContent>
                <RequirementDisplay requirement={requirement} />
            </DialogContent>
        </Dialog>
    );
};

export default RequirementModal;
