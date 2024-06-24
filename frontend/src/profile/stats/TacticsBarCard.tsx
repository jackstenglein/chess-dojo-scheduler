import { Card, CardContent } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { useRequirements } from '../../api/cache/requirements';
import { ALL_COHORTS, User } from '../../database/user';
import { calculateTacticsRating } from '../../exams/view/exam';
import BarGraph from './BarGraph';
import { Stack, Tooltip, Typography } from '@mui/material';
import { getTooltip } from './TacticsMeterCard';

interface TacticsScoreCardProps {
    user: User;
}

function isTargetInRange(min: number, max: number, target: number): boolean {
    if (min > max) {
        return false;
    }
    return target >= min && target <= max;
}

export function getRatingCompoProgressColor(
    userMinCohort: number,
    userMaxCohort: number,
    compRating: number,
): string {
    console.log('Comp ' + compRating);
    console.log('Max ' + userMaxCohort);
    console.log('Min ' + userMinCohort);

    const maxc = userMaxCohort + 100;

    if (compRating > maxc || isTargetInRange(userMaxCohort, maxc, compRating)) {
        return '#088529';
    } else if (isTargetInRange(userMinCohort - 100, maxc, compRating)) {
        return '#b6c906';
    } else if (compRating < userMinCohort / 2) {
        return '#7a0505';
    }

    return '#7a0505';
}

const TacticsBarGraphCard: React.FC<TacticsScoreCardProps> = ({ user }) => {
    const { requirements } = useRequirements(ALL_COHORTS, true);
    const tacticsRating = calculateTacticsRating(user, requirements);
    const minCohort = parseInt(user.dojoCohort);
    const maxCohort =
        user.dojoCohort.split('-').length > 1
            ? parseInt(user.dojoCohort.split('-')[1])
            : minCohort;

    const isProvisional = tacticsRating.components.some((c) => c.rating < 0);
    const tacRating = tacticsRating.overall;
    
    let progressColors = [];
    let checkmate = 0;
    let pr5 = 0;
    let prSuv = 0;

    tacticsRating.components.map((c) => {
        switch (c.name) {
            case 'Checkmate Rating':
                if(c.rating <= 0){
                    checkmate = 0;
                    return;
                }
                checkmate =  Math.round(c.rating);
                break;
            case 'PR 5 Min':
                 if(c.rating <= 0){
                    pr5 = 0;
                    return;
                 }
                 pr5 =  Math.round(c.rating);
                 break;
            case 'PR Survival':
                if(c.rating <= 0){
                    prSuv = 0
                    return;
                }
                 prSuv = Math.round(c.rating);
                break;              
        }
    });

   
        progressColors = [
            getRatingCompoProgressColor(minCohort, maxCohort, tacRating <= 0 ? 0 : tacticsRating.overall),
            getRatingCompoProgressColor(minCohort, maxCohort, checkmate),
            getRatingCompoProgressColor(minCohort, maxCohort, pr5),
            getRatingCompoProgressColor(minCohort, maxCohort, prSuv),
        ];
    

    return (
        <Card variant='outlined'>
            <CardContent>
            <Stack
                    direction='row'
                    mb={2}
                    spacing={2}
                    justifyContent='center'
                    alignItems='center'
                >
                    <Typography
                        variant='h6'
                        sx={{
                            fontWeight: 'bold',
                        }}
                    >
                        Tactics Rating:{' '}
                    </Typography>

                    <Tooltip
                        title={getTooltip(
                            tacticsRating.overall,
                            minCohort,
                            maxCohort,
                            isProvisional,
                        )}
                    >
                        <Stack
                            mb={2}
                            spacing={1}
                            justifyContent='center'
                            alignItems='center'
                        >
                            <Typography
                                variant='h6'
                                sx={{
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                }}
                                color={
                                    tacticsRating.overall < minCohort
                                        ? 'error'
                                        : tacticsRating.overall > maxCohort
                                          ? 'success.main'
                                          : 'warning.main'
                                }
                            >
                                {Math.round(tacticsRating.overall)}
                                {isProvisional && '?'}
                            </Typography>
                        </Stack>
                    </Tooltip>
                </Stack>
                <Grid2 container rowGap={4} columnSpacing={2} justifyContent='center'>
                    <BarGraph
                        width={900}
                        height={400}
                        tacRating={tacRating}
                        checkRating={checkmate}
                        pr5Rating={pr5}
                        prsuRating={prSuv}
                        progressColors={progressColors}
                    />
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default TacticsBarGraphCard;
