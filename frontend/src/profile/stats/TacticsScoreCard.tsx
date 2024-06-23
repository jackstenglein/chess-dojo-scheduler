import { Card, CardContent } from '@mui/material';
import Button from '@mui/material/Button';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React, { useState } from 'react';
import { User } from '../../database/user';
import TacticsBarGraphCard from './TacticsBarCard';
import Icon from '../../style/Icon';
import TacticsMeterCard from './TacticsMeterCard';
import { RequirementCategory } from '../../database/requirement';



interface TacticsScoreCardProps {
    user: User;
}

const TacticsScoreCard: React.FC<TacticsScoreCardProps> = ({ user }) => {
    const [showMeterCard, setShowMeterCard] = useState(true);

    const handleButtonClick = () => {
        setShowMeterCard(!showMeterCard);
    };

    return (
        <div>
            <Card variant='outlined'>
                <CardContent>
                    {showMeterCard ? (
                        <TacticsMeterCard user={user} />
                    ) : (
                        <TacticsBarGraphCard user={user}/>
                    )}
                    <Grid2 container rowGap={4} columnSpacing={2} justifyContent='end'>
                        <Button variant='text' onClick={handleButtonClick} color='info' startIcon={showMeterCard ?  <Icon name='leaderboard' fontSize='large'/> : <Icon name={RequirementCategory.Tactics} fontSize='large'/>}>
                         Change View
                        </Button>
                    </Grid2>
                </CardContent>
            </Card>
        </div>
    );
};

export default TacticsScoreCard;
