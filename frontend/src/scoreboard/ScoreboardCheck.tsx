import { useState } from 'react';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Box } from '@mui/material';

import { Requirement } from '../database/requirement';
import ProgressUpdateDialog from '../profile/progress/ProgressUpdateDialog';
import { useAuth } from '../auth/Auth';

interface ScoreboardCheckProps {
    value: number;
    total: number;
    username?: string;
    cohort: string;
    requirement?: Requirement;
}

const ScoreboardCheck: React.FC<ScoreboardCheckProps> = ({
    value,
    total,
    username,
    cohort,
    requirement,
}) => {
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const user = useAuth().user!;

    const canUpdate = requirement && user.username === username;
    const onClick = canUpdate ? () => setShowUpdateDialog(true) : undefined;

    return (
        <>
            <Box
                sx={{ width: 1, display: 'flex', justifyContent: 'center' }}
                onClick={onClick}
            >
                {value < total ? (
                    <CheckBoxOutlineBlankIcon />
                ) : (
                    <CheckBoxIcon color='primary' />
                )}
            </Box>
            {canUpdate && showUpdateDialog && (
                <ProgressUpdateDialog
                    open={showUpdateDialog}
                    onClose={() => setShowUpdateDialog(false)}
                    requirement={requirement}
                    cohort={cohort}
                    progress={user.progress[requirement.id]}
                />
            )}
        </>
    );
};

export default ScoreboardCheck;
