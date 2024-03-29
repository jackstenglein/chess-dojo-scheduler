import {
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Box,
} from '@mui/material';
import { TooltipRenderProps } from 'react-joyride';

import ScoreboardProgress from '../scoreboard/ScoreboardProgress';

const TutorialTooltip: React.FC<TooltipRenderProps> = ({
    index,
    step,
    tooltipProps,
    primaryProps,
    backProps,
    size,
    isLastStep,
}) => {
    return (
        <Card data-cy='tutorial-tooltip' sx={{ maxWidth: 'md' }} {...tooltipProps}>
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
