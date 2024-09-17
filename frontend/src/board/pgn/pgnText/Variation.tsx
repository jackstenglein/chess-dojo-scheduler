import { Event, EventType } from '@jackstenglein/chess';
import { Grid, Paper} from '@mui/material';
import { useEffect, useState } from 'react';
import { useChess } from '../PgnBoard';
import MoveDisplay from './MoveDisplay';
import AnalysisTab from '../boardTools/underboard/engine/AnalysisTab';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import Switch, { SwitchProps } from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
interface VariationProps {
    handleScroll: (child: HTMLElement | null) => void;
}

const IOSSwitch = styled((props: SwitchProps) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
  ))(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
      padding: 0,
      margin: 2,
      transitionDuration: '300ms',
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          backgroundColor: '#65C466',
          opacity: 1,
          border: 0,
          ...theme.applyStyles('dark', {
            backgroundColor: '#2ECA45',
          }),
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5,
        },
      },
      '&.Mui-focusVisible .MuiSwitch-thumb': {
        color: '#33cf4d',
        border: '6px solid #fff',
      },
      '&.Mui-disabled .MuiSwitch-thumb': {
        color: theme.palette.grey[100],
        ...theme.applyStyles('dark', {
          color: theme.palette.grey[600],
        }),
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.7,
        ...theme.applyStyles('dark', {
          opacity: 0.3,
        }),
      },
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 22,
      height: 22,
    },
    '& .MuiSwitch-track': {
      borderRadius: 26 / 2,
      backgroundColor: '#E9E9EA',
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500,
      }),
      ...theme.applyStyles('dark', {
        backgroundColor: '#39393D',
      }),
    },
  }));

const Variation: React.FC<VariationProps> = ({ handleScroll }) => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    const [showAnalysisTab, setShowAnalysisTab] = useState(false);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.Initialized,
                    EventType.DeleteMove,
                    EventType.PromoteVariation,
                    EventType.LegalMove,
                ],
                handler: (event: Event) => {
                    if (event.type === EventType.Initialized) {
                        setForceRender((v) => v + 1);
                    }
                    if (event.type === EventType.DeleteMove && event.mainlineMove) {
                        setForceRender((v) => v + 1);
                    }
                    if (
                        event.type === EventType.PromoteVariation &&
                        chess.isInMainline(event.variantRoot)
                    ) {
                        console.log('Variation forcing render: ', event);
                        setForceRender((v) => v + 1);
                    }
                    if (
                        event.type === EventType.LegalMove &&
                        chess.lastMove() === event.move
                    ) {
                        setForceRender((v) => v + 1);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    return (
        <Paper sx={{ boxShadow: 'none' }}>
           
            <IOSSwitch
                        checked={showAnalysisTab}
                        onChange={() => setShowAnalysisTab((prev) => !prev)}
                        color="success"
                        
                    />
                
            
                {/* Conditionally render the AnalysisTab based on the switch state */}
                {showAnalysisTab && <AnalysisTab />}
            

            <Grid container>
                {chess?.history().map((move) => {
                    return (
                        <MoveDisplay
                            move={move}
                            handleScroll={handleScroll}
                            key={move.ply}
                        />
                    );
                })}
            </Grid>
        </Paper>
    );
};

export default Variation;
