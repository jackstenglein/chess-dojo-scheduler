import { Card, CardContent } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React from 'react';
import { User } from '../../database/user';
import TacticsBarGraphCard from './TacticsBarCard';
import TacticsMeterCard from './TacticsMeterCard';
interface TacticsScoreCardProps {
    user: User;
}

const TacticsScoreCard: React.FC<TacticsScoreCardProps> = ({ user }) => {
    const [graphpicker, setGraphPicker] = React.useState<'meter' | 'bar'>('meter');

    return (
        <div>
            <Card variant='outlined'>
                <CardContent>
                    <Grid2 container rowGap={4} columnSpacing={2} justifyContent='end'>
                        <TextField
                            select
                            sx={{ minWidth: 150 }}
                            label='Pick Graph Type'
                            value={graphpicker}
                            onChange={(event) =>
                                setGraphPicker(event.target.value as 'meter' | 'bar')
                            }
                        >
                            <MenuItem value='meter'> Meter </MenuItem>
                            <MenuItem value='bar'> Bar </MenuItem>
                        </TextField>
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
