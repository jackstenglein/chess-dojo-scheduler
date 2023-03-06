import { Typography, Stack, Checkbox, Divider, IconButton, Grid } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';

import {
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
} from '../database/requirement';
import ScoreboardProgress from '../scoreboard/ScoreboardProgress';
import { ALL_COHORTS } from '../database/user';

interface ProgressItemProps {
    progress?: RequirementProgress;
    requirement: Requirement;
    cohort: string;
}

const DESCRIPTION_MAX_LENGTH = 90;

const ProgressItem: React.FC<ProgressItemProps> = ({ progress, requirement, cohort }) => {
    const totalCount = requirement.counts[cohort] || requirement.counts[ALL_COHORTS];
    const currentCount = progress?.counts[cohort] || progress?.counts[ALL_COHORTS] || 0;

    let DescriptionElement = null;
    let UpdateElement = null;

    switch (requirement.scoreboardDisplay) {
        case ScoreboardDisplay.Hidden:
        case ScoreboardDisplay.Checkbox:
            UpdateElement = (
                <Checkbox
                    aria-label={`Checkbox ${requirement.name}`}
                    checked={currentCount >= totalCount}
                />
            );
            break;

        case ScoreboardDisplay.ProgressBar:
        case ScoreboardDisplay.Unspecified:
            DescriptionElement = (
                <ScoreboardProgress value={currentCount} max={totalCount} min={0} />
            );
            UpdateElement = (
                <IconButton aria-label={`Update ${requirement.name}`}>
                    <EditIcon />
                </IconButton>
            );
            break;
    }

    return (
        <Stack spacing={2} mt={2}>
            <Grid
                container
                columnGap={0.5}
                alignItems='center'
                justifyContent='space-between'
            >
                <Grid item xs={9} xl={10}>
                    <Typography>{requirement.name}</Typography>
                    <Typography color='text.secondary'>
                        {`${requirement.description.substring(
                            0,
                            DESCRIPTION_MAX_LENGTH
                        )}${
                            requirement.description.length > DESCRIPTION_MAX_LENGTH
                                ? '...'
                                : ''
                        }`}
                    </Typography>
                    {DescriptionElement}
                </Grid>
                <Grid item xs={2} xl={1}>
                    <Stack direction='row' alignItems='center' justifyContent='end'>
                        {UpdateElement}
                        <IconButton aria-label={`Info ${requirement.name}`}>
                            <InfoOutlinedIcon sx={{ color: 'text.secondary' }} />
                        </IconButton>
                    </Stack>
                </Grid>
            </Grid>
            <Divider />
        </Stack>
    );
};

export default ProgressItem;
