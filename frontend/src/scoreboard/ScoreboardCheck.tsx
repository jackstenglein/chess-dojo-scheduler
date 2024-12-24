import { useAuth } from '@/auth/Auth';
import { Requirement } from '@/database/requirement';
import ProgressDialog from '@/profile/progress/ProgressDialog';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Box } from '@mui/material';
import { useState } from 'react';

interface ScoreboardCheckProps {
    value: number;
    total: number;
    username?: string;
    cohort: string;
    requirement?: Requirement;
    fullHeight?: boolean;
}

const ScoreboardCheck: React.FC<ScoreboardCheckProps> = ({
    value,
    total,
    username,
    cohort,
    requirement,
    fullHeight,
}) => {
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const { user } = useAuth();

    const canUpdate = requirement && user?.username === username;
    const onClick = canUpdate ? () => setShowUpdateDialog(true) : undefined;

    return (
        <>
            <Box
                sx={{
                    width: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: fullHeight ? 1 : undefined,
                }}
                onClick={onClick}
            >
                {value < total ? (
                    <CheckBoxOutlineBlankIcon />
                ) : (
                    <CheckBoxIcon color='primary' />
                )}
            </Box>
            {canUpdate && showUpdateDialog && (
                <ProgressDialog
                    open={showUpdateDialog}
                    onClose={() => setShowUpdateDialog(false)}
                    requirement={requirement}
                    cohort={cohort}
                    progress={user?.progress[requirement.id]}
                />
            )}
        </>
    );
};

export default ScoreboardCheck;
