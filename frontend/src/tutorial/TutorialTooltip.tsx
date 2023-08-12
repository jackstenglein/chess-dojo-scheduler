import {
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Box,
} from '@mui/material';
import { Step, TooltipRenderProps } from 'react-joyride';

import ScoreboardProgress from '../scoreboard/ScoreboardProgress';
import { useTutorial } from './TutorialContext';

export interface TutorialStep extends Step {
    nextDisabled?: boolean;
}

interface TutorialTooltipProps extends TooltipRenderProps {
    step: TutorialStep;
}

const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
    index,
    step,
    tooltipProps,
    primaryProps,
    backProps,
    size,
    isLastStep,
}) => {
    const { tutorialState } = useTutorial();

    return (
        <Card sx={{ maxWidth: 'md' }} {...tooltipProps}>
            <CardHeader title={step.title} />
            <CardContent>
                <Typography>{step.content}</Typography>
            </CardContent>
            <CardActions>
                {index > 0 && <Button {...backProps}>Back</Button>}
                <Button
                    variant='contained'
                    color='primary'
                    onClick={primaryProps.onClick}
                    disabled={tutorialState.nextDisabled}
                >
                    {isLastStep ? 'Close' : 'Next'}
                </Button>
                <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <ScoreboardProgress min={0} max={size} value={index + 1} />
                </Box>
            </CardActions>
        </Card>
    );
};

export default TutorialTooltip;
