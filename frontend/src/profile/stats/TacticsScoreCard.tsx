import { Card, CardContent } from '@mui/material';
import Button from '@mui/material/Button';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React, { useState } from 'react';
import { User } from '../../database/user';
import ExamGraphComposer from '../../exams/list/ExamGraphComposer';
import TacticsMeterCard from './TacticsMeterCard';
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
                    <Grid2 container rowGap={4} columnSpacing={2} justifyContent='center'>
                        <Button variant='text' onClick={handleButtonClick}>
                            {showMeterCard ? 'Show Bar Graph' : 'Show Component A'}
                        </Button>
                    </Grid2>
                    {showMeterCard ? (
                        <TacticsMeterCard user={user} />
                    ) : (
                        <ExamGraphComposer width={800} height={500} user={user} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TacticsScoreCard;
