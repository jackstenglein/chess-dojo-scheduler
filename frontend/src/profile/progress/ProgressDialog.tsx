import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, MenuItem } from '@mui/material';

import {
    CustomTask,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
} from '../../database/requirement';
import { compareCohorts, dojoCohorts } from '../../database/user';
import ProgressHistory from './ProgressHistory';
import ProgressUpdater from './ProgressUpdater';

enum ProgressDialogView {
    Updater = 'UPDATER',
    History = 'HISTORY',
}

interface ProgressDialogProps {
    open: boolean;
    onClose: () => void;
    requirement: Requirement | CustomTask;
    progress?: RequirementProgress;
    cohort: string;
    selectCohort?: boolean;
}

const ProgressDialog: React.FC<ProgressDialogProps> = ({
    open,
    onClose,
    requirement,
    progress,
    cohort,
    selectCohort,
}) => {
    const [view, setView] = useState<ProgressDialogView>(ProgressDialogView.Updater);

    const cohortOptions = requirement.counts.ALL_COHORTS
        ? dojoCohorts
        : Object.keys(requirement.counts).sort(compareCohorts);
    const initialCohort = cohortOptions.includes(cohort) ? cohort : cohortOptions[0];
    const [selectedCohort, setSelectedCohort] = useState(initialCohort);

    const totalCount = requirement.counts[selectedCohort] || 0;
    const isNonDojo = requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo;

    let requirementName = requirement.name;
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        requirementName += ` (${totalCount})`;
    }

    let dialogTitle = '';
    if (view === ProgressDialogView.History) {
        dialogTitle = `${requirementName} History`;
    } else if (isNonDojo) {
        dialogTitle = `Add time to ${requirementName}?`;
    } else {
        dialogTitle = `Update ${requirementName}?`;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md'>
            <DialogTitle>{dialogTitle}</DialogTitle>

            {(selectCohort || view === ProgressDialogView.History) && (
                <DialogContent sx={{ overflowY: 'visible' }}>
                    <TextField
                        select
                        label='Cohort'
                        value={selectedCohort}
                        onChange={(event) => setSelectedCohort(event.target.value)}
                        sx={{ mt: 1 }}
                        fullWidth
                    >
                        {cohortOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
            )}

            {view === ProgressDialogView.History && (
                <ProgressHistory
                    requirement={requirement}
                    onClose={onClose}
                    toggleView={() => setView(ProgressDialogView.Updater)}
                    cohort={selectedCohort}
                />
            )}
            {view === ProgressDialogView.Updater && (
                <ProgressUpdater
                    requirement={requirement}
                    progress={progress}
                    cohort={selectedCohort}
                    onClose={onClose}
                    toggleView={() => setView(ProgressDialogView.History)}
                />
            )}
        </Dialog>
    );
};

export default ProgressDialog;
