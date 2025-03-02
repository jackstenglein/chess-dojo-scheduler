import { TimelineProvider } from '@/components/profile/activity/useTimeline';
import { TaskDialog, TaskDialogView } from '@/components/profile/trainingPlan/TaskDialog';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Box } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../auth/Auth';
import { Requirement } from '../database/requirement';

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
            {canUpdate && showUpdateDialog && user && (
                <TimelineProvider owner={user.username}>
                    <TaskDialog
                        open
                        onClose={() => setShowUpdateDialog(false)}
                        task={requirement}
                        initialView={TaskDialogView.Progress}
                        cohort={cohort}
                        progress={user.progress[requirement.id]}
                    />
                </TimelineProvider>
            )}
        </>
    );
};

export default ScoreboardCheck;
