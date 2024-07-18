import { Card, CardContent } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React from 'react';
import { RequirementCategory } from '../../database/requirement';
import { User } from '../../database/user';
import Icon from '../../style/Icon';
import TacticsBarGraphCard from './TacticsBarCard';
import TacticsMeterCard from './TacticsMeterCard';

interface TacticsScoreCardProps {
    user: User;
}

const TacticsScoreCard: React.FC<TacticsScoreCardProps> = ({ user }) => {
    const [graphpicker, setGraphPicker] = React.useState<string | null>('meter');

    const handleAlignment = (
        _event: React.MouseEvent<HTMLElement>,
        newAlignment: string | null,
    ) => {
        setGraphPicker(newAlignment);
    };

    return (
        <div>
            <Card variant='outlined'>
                <CardContent>
                    <Grid2 container rowGap={4} columnSpacing={2} justifyContent='end'>
                        <ToggleButtonGroup
                            value={graphpicker}
                            exclusive
                            onChange={handleAlignment}
                            aria-label='text alignment'
                        >
                            <ToggleButton value='meter' aria-label='View meter graph'>
                                <Icon
                                    name={RequirementCategory.Tactics}
                                    color='primary'
                                />
                            </ToggleButton>
                            <ToggleButton value='bar' aria-label='View bar graph'>
                                <Icon name='leaderboard' color='primary' />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid2>
                </CardContent>
                <CardContent>
                    {graphpicker === 'meter' ? (
                        <TacticsMeterCard user={user} />
                    ) : (
                        <TacticsBarGraphCard user={user} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TacticsScoreCard;
