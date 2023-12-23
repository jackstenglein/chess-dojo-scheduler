import { Help } from '@mui/icons-material';
import { Stack, Typography, Tooltip } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';

interface PercentilesProps {
    cohort: string;
    percentile: number;
    cohortPercentile: number;
}

const Percentiles: React.FC<PercentilesProps> = ({
    cohort,
    percentile,
    cohortPercentile,
}) => {
    return (
        <>
            <Grid2 xs={12} sm={4} display='flex' justifyContent='center'>
                <Stack alignItems='end'>
                    <Stack spacing={0.5} direction='row' alignItems='center'>
                        <Typography variant='caption' color='text.secondary'>
                            Percentile
                        </Typography>
                        <Tooltip title='The percent of players in the Dojo whose total time is below yours'>
                            <Help
                                fontSize='inherit'
                                sx={{
                                    color: 'text.secondary',
                                }}
                            />
                        </Tooltip>
                    </Stack>

                    <Typography
                        sx={{
                            fontSize: '2.25rem',
                            lineHeight: 1,
                            fontWeight: 'bold',
                        }}
                    >
                        {percentile}%
                    </Typography>
                </Stack>
            </Grid2>

            <Grid2 xs={12} sm={4} display='flex' justifyContent='center'>
                <Stack alignItems='end'>
                    <Stack spacing={0.5} direction='row' alignItems='center'>
                        <Typography variant='caption' color='text.secondary'>
                            Cohort Percentile
                        </Typography>
                        <Tooltip
                            title={`The percent of players in the ${cohort} cohort whose total time is below yours`}
                        >
                            <Help
                                fontSize='inherit'
                                sx={{
                                    color: 'text.secondary',
                                }}
                            />
                        </Tooltip>
                    </Stack>

                    <Typography
                        sx={{
                            fontSize: '2.25rem',
                            lineHeight: 1,
                            fontWeight: 'bold',
                        }}
                    >
                        {cohortPercentile}%
                    </Typography>
                </Stack>
            </Grid2>
        </>
    );
};

export default Percentiles;
