import { Help } from '@mui/icons-material';
import { Box, Card, CardContent, Stack, Tooltip, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { useRequirements } from '../../api/cache/requirements';
import { ALL_COHORTS, User } from '../../database/user';
import { calculateTacticsRating } from '../../tactics/tactics';

interface TacticsScoreCardProps {
    user: User;
}

const TacticsScoreCard: React.FC<TacticsScoreCardProps> = ({ user }) => {
    const { requirements } = useRequirements(ALL_COHORTS, true);
    const tacticsRating = calculateTacticsRating(user, requirements);

    return (
        <Card variant='outlined'>
            <CardContent>
                <Box mb={2}>
                    <Typography variant='h6'>Tactics Rating</Typography>
                </Box>

                <Grid2 container rowGap={4} columnSpacing={2} justifyContent='center'>
                    <Grid2 xs={12} display='flex' justifyContent='center'>
                        <Stack direction='row' alignItems='end'>
                            <Stack alignItems='end'>
                                <Typography variant='subtitle1' color='text.secondary'>
                                    Overall
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: '2.3rem',
                                        lineHeight: 1,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {Math.round(tacticsRating.overall)}
                                </Typography>
                            </Stack>
                            <Tooltip title='Overall tactics rating is the average of the below components'>
                                <Help
                                    sx={{
                                        mb: '5px',
                                        ml: '3px',
                                        color: 'text.secondary',
                                    }}
                                />
                            </Tooltip>
                        </Stack>
                    </Grid2>

                    {tacticsRating.components.map((c) => (
                        <Grid2
                            key={c.name}
                            xs={6}
                            sm={3}
                            md
                            display='flex'
                            justifyContent='center'
                        >
                            <Stack direction='row' alignItems='end'>
                                <Stack alignItems='end'>
                                    <Typography variant='body2' color='text.secondary'>
                                        {c.name}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: '2rem',
                                            lineHeight: 1,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {Math.round(c.rating)}
                                    </Typography>
                                </Stack>
                                <Tooltip title={c.description}>
                                    <Help
                                        sx={{
                                            mb: '5px',
                                            ml: '3px',
                                            color: 'text.secondary',
                                        }}
                                    />
                                </Tooltip>
                            </Stack>
                        </Grid2>
                    ))}
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default TacticsScoreCard;
