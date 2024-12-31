import { Dialog, DialogContent, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useEffect } from 'react';

import { EventType, trackEvent } from '@/analytics/events';
import { CustomTask, Requirement } from '@/database/requirement';
import RequirementDisplay from './RequirementDisplay';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction='up' ref={ref} {...props} />;
});

interface RequirementModalProps {
    open: boolean;
    onClose: () => void;
    requirement: Requirement | CustomTask;
    cohort?: string;
}

const RequirementModal: React.FC<RequirementModalProps> = ({
    open,
    onClose,
    requirement,
    cohort,
}) => {
    useEffect(() => {
        if (open) {
            trackEvent(EventType.ViewTaskDetails, {
                requirement_id: requirement.id,
                requirement_name: requirement.name,
            });
        }
    }, [open, requirement]);

    return (
        <Dialog
            maxWidth='lg'
            fullWidth
            open={open}
            onClose={onClose}
            TransitionComponent={Transition}
        >
            <DialogContent>
                <RequirementDisplay
                    requirement={requirement}
                    onClose={onClose}
                    cohort={cohort}
                />
            </DialogContent>
        </Dialog>
    );
};

export default RequirementModal;
