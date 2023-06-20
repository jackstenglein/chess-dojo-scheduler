import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';

import { CustomTask } from '../database/requirement';
import { useAuth } from '../auth/Auth';
import CustomTaskEditor from '../profile/progress/CustomTaskEditor';
import DeleteCustomTaskModal from './DeleteCustomTaskModal';

interface CustomTaskDisplayProps {
    task: CustomTask;
    onClose?: () => void;
}

const CustomTaskDisplay: React.FC<CustomTaskDisplayProps> = ({ task, onClose }) => {
    const user = useAuth().user!;
    const [showEditor, setShowEditor] = useState(false);
    const [showDeleter, setShowDeleter] = useState(false);

    return (
        <>
            <Stack spacing={3}>
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    flexWrap='wrap'
                    rowGap={1}
                >
                    <Stack>
                        <Typography variant='h4'>{task.name}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            Non-Dojo
                        </Typography>
                    </Stack>

                    {task.owner === user.username && (
                        <Stack direction='row' spacing={2}>
                            <Button
                                variant='contained'
                                onClick={() => setShowEditor(true)}
                            >
                                Edit Task
                            </Button>
                            <Button
                                variant='contained'
                                color='error'
                                onClick={() => setShowDeleter(true)}
                            >
                                Delete Task
                            </Button>
                        </Stack>
                    )}
                </Stack>

                <Typography variant='body1' sx={{ whiteSpace: 'pre-line', mt: 3 }}>
                    {task.description}
                </Typography>
            </Stack>

            <CustomTaskEditor
                open={showEditor}
                onClose={() => setShowEditor(false)}
                task={task}
            />

            <DeleteCustomTaskModal
                task={task}
                open={showDeleter}
                onCancel={() => setShowDeleter(false)}
                onDelete={onClose}
            />
        </>
    );
};

export default CustomTaskDisplay;
