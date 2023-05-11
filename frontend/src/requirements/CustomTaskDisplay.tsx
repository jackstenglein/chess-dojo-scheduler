import { Stack, Typography } from '@mui/material';
import { CustomTask } from '../database/requirement';
// import { useAuth } from '../auth/Auth';

interface CustomTaskDisplayProps {
    task: CustomTask;
}

const CustomTaskDisplay: React.FC<CustomTaskDisplayProps> = ({ task }) => {
    // const user = useAuth().user!;

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

                    {/* {task.owner === user.username && (
                        <Stack direction='row'>
                            <Button color='error'>Delete Activity</Button>
                            <Button>Edit Activity</Button>
                        </Stack>
                    )} */}
                </Stack>

                <Typography variant='body1' sx={{ whiteSpace: 'pre-line', mt: 3 }}>
                    {task.description}
                </Typography>
            </Stack>
        </>
    );
};

export default CustomTaskDisplay;
