import { Help } from '@mui/icons-material';
import { Grid, Stack, Tooltip, Typography } from '@mui/material';

interface PercentilesProps {
    cohort: string;
    percentile: number;
    cohortPercentile: number;
    description: string;
}

const Percentiles: React.FC<PercentilesProps> = ({
    cohort,
    percentile,
    cohortPercentile,
    description,
}) => {
    return (
        <>
            <Grid
                display='flex'
                justifyContent='center'
                size={{
                    xs: 12,
                    sm: 4,
                }}
            >
                <Stack alignItems='center'>
                    <Stack spacing={0.5} direction='row' alignItems='center'>
                        <Typography variant='caption' color='text.secondary'>
                            Percentile
                        </Typography>
                        <Tooltip
                            title={`The percent of Dojo members active in the past 3 months whose ${description} is below yours`}
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
                        {Math.round(10 * percentile) / 10}%
                    </Typography>
                </Stack>
            </Grid>
            <Grid
                display='flex'
                justifyContent='center'
                size={{
                    xs: 12,
                    sm: 4,
                }}
            >
                <Stack alignItems='center'>
                    <Stack spacing={0.5} direction='row' alignItems='center'>
                        <Typography variant='caption' color='text.secondary'>
                            Cohort Percentile
                        </Typography>
                        <Tooltip
                            title={`The percent of members in the ${cohort} cohort active in the past 3 months whose ${description} is below yours`}
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
                        {Math.round(10 * cohortPercentile) / 10}%
                    </Typography>
                </Stack>
            </Grid>
        </>
    );
};

export default Percentiles;
