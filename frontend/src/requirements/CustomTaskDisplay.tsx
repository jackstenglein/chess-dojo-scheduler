import { Stack, Typography } from '@mui/material';
import { CustomTask } from '../database/requirement';

interface CustomTaskDisplayProps {
    task: CustomTask;
}

const CustomTaskDisplay: React.FC<CustomTaskDisplayProps> = ({ task }) => {
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
                </Stack>

                <Typography variant='body1' sx={{ whiteSpace: 'pre-line', mt: 3 }}>
                    {task.description}
                </Typography>
            </Stack>
        </>
    );
};

export default CustomTaskDisplay;
