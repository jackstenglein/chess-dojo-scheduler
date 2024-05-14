import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Box, Link, Stack, Typography } from '@mui/material';

import { LigaTournament, displayTournamentType } from '../../database/event';
import Board from '../../board/Board';
import { useEffect, useState } from 'react';
import Icon from '../../style/Icon';


function getLigaIconBasedOnTimeControl(timeControl: number): string {

    const tc = timeControl / 60;
    console.log(tc)

    if(tc >= 3 && tc <= 9) {
        return "Blitz"
    }else if (tc >= 10 && tc < 60){
        return "Rapid"
    }else if (tc >= 60 && tc <= 180){
        return "Classical"
    }

    return "error";

}


interface LigaTournamentViewerProps {
    processedEvent: ProcessedEvent;
}

const LigaTournamentViewer: React.FC<LigaTournamentViewerProps> = ({
    processedEvent,
}) => {
    const [displayPosition, setDisplayPosition] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setDisplayPosition(true);
        }, 250);
    }, [setDisplayPosition]);

    const ligaTournament: LigaTournament = processedEvent.event.ligaTournament;
    if (!ligaTournament) {
        return null;
    }

    return (
        <Stack sx={{ py: 2 }} spacing={2}>
            <Typography variant='body1'>
                {ligaTournament.rated ? 'Rated' : 'Unrated'}{' '}
                {displayTournamentType(ligaTournament.type)}
            </Typography>

            {processedEvent.event.location && (
                <Stack>
                    <Typography variant='h6' color='text.secondary'>
                        <Icon name='location' color='primary' sx={{marginRight: "0.5rem", verticalAlign: "middle"}}/>
                        Location
                    </Typography>
                    <Link
                        variant='body1'
                        href={processedEvent.event.location}
                        target='_blank'
                        rel='noreferrer'
                        
                    >
                        {processedEvent.event.location}
                    </Link>
                </Stack>
            )}

            {processedEvent.event.description && (
                <Stack>
                    <Typography variant='h6' color='text.secondary'>
                    <Icon name='notes' color='primary' sx={{marginRight: "0.5rem", verticalAlign: "middle"}}/>
                        Description
                    </Typography>
                    <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                        {processedEvent.event.description}
                    </Typography>
                </Stack>
            )}

            <Stack>
                <Typography variant='h6' color='text.secondary'>
                    
                 <Icon name={getLigaIconBasedOnTimeControl(ligaTournament.limitSeconds)} color='primary' sx={{marginRight: "0.5rem", verticalAlign: "middle"}}/>
                    Time Control
                </Typography>
                <Typography variant='body1'>
                    {ligaTournament.limitSeconds / 60}+{ligaTournament.incrementSeconds}
                </Typography>
            </Stack>

            {ligaTournament.numRounds && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        {ligaTournament.currentRound ? 'Round' : 'Rounds'}
                    </Typography>
                    <Typography variant='body1'>
                        {ligaTournament.currentRound
                            ? `${ligaTournament.currentRound}/${ligaTournament.numRounds}`
                            : ligaTournament.numRounds}
                    </Typography>
                </Stack>
            )}

            {ligaTournament.fen && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Position
                    </Typography>
                    <Box
                        sx={{
                            px: 0,
                            width: 1,
                            aspectRatio: 1,
                        }}
                    >
                        {displayPosition && (
                            <Board
                                config={{
                                    fen: ligaTournament.fen.trim(),
                                    viewOnly: true,
                                }}
                                onInitialize={(board) => board.redrawAll()}
                            />
                        )}
                    </Box>
                </Stack>
            )}
        </Stack>
    );
};

export default LigaTournamentViewer;
