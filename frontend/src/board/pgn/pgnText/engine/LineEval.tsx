import { getLineEvalLabel, moveLineUciToSan } from '@/stockfish/engine/ChessHelper';
import { LineEval } from '@/stockfish/engine/engine';
import { LinearProgress, ListItem, Skeleton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface Props {
    line: LineEval;
}

export default function LineEvaluation({ line }: Props) {
    const lineLabel = getLineEvalLabel(line);

    const isBlackCp =
        (line.cp !== undefined && line.cp < 0) ||
        (line.mate !== undefined && line.mate < 0);

    const showSkeleton = line.depth < 6;

    // State to control progress bar visibility
    const [showProgress, setShowProgress] = useState(false);

    useEffect(() => {
        // Trigger progress bar when label changes
        setShowProgress(true);

        // Hide progress bar after 1 second
        const timer = setTimeout(() => {
            setShowProgress(false);
        }, 1000);

        return () => clearTimeout(timer); // Cleanup the timer
    }, [lineLabel]); // Dependency on lineLabel

    return (
        <ListItem disablePadding>
            <Typography
                marginRight={1.5}
                marginY={0.5}
                paddingY={0.2}
                noWrap
                overflow='visible'
                width='3.5em'
                textAlign='center'
                fontSize='0.8rem'
                sx={{
                    backgroundColor: isBlackCp ? 'black' : 'white',
                    color: isBlackCp ? 'white' : 'black',
                }}
                borderRadius='5px'
                border='1px solid #424242'
                fontWeight='bold'
            >
                {showSkeleton ? (
                    <Skeleton
                        variant='rounded'
                        animation='wave'
                        sx={{ color: 'transparent' }}
                    >
                        placeholder
                    </Skeleton>
                ) : (
                    lineLabel
                )}
            </Typography>

            <Typography
                noWrap
                maxWidth={{ xs: '12em', sm: '25em', md: '30em', lg: '25em' }}
                fontSize='0.9rem'
            >
                {showSkeleton ? (
                    <Skeleton variant='rounded' animation='wave' width='15em' />
                ) : (
                    line.pv.map(moveLineUciToSan(line.fen)).join(', ')
                )}
            </Typography>

            {/* Show LinearProgress for 1 second when label changes */}
            {showProgress && (
                <LinearProgress
                    sx={{
                        width: '100%',
                        marginTop: 1,
                        backgroundColor: 'lightgray',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: 'green',
                        },
                    }}
                />
            )}
        </ListItem>
    );
}
