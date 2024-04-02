import { EndgamePosition, newEndgamePosition } from '@bendk/chess-tree'
import { Chess } from '@jackstenglein/chess';
import React, { useCallback, useMemo, useState } from 'react';
import { Container, Button, Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import BoardEditor from './BoardEditor'
import EndgamePositionCard from './EndgamePositionCard'

interface EndgamePositionSelectorProps {
    positions: EndgamePosition[];
    onDelete: (position: EndgamePosition) => void;
    onSelect: (position: EndgamePosition) => void;
    onCreate: (position: EndgamePosition) => void;
    onExit: () => void;
}

const EndgamePositionSelector: React.FC<EndgamePositionSelectorProps> = ({positions, onSelect, onDelete, onCreate, onExit}) => {
    const [adding, setAdding] = useState<boolean>(positions.length === 0)
    const [color, setColor] = useState<"w"|"b">("w")
    const [position, setPosition] = useState<string>("8/8/8/8/8/8/8/8 w - - 0 1")
    const size = "600px"
    const fen = `${position} ${color} - - 0 1`

    const positionIsValid = useMemo(() => {
        try {
            new Chess(fen)
            return true
        } catch  {
            return false
        }
    }, [fen])

    const onAddClick = useCallback(() => {
        onCreate(newEndgamePosition(fen, color))
    }, [onCreate, color, fen])

    if (adding) {
        return <Container maxWidth='lg' sx={{ pt: 6 }}>
            <Stack width={size}>
                <Stack direction="row" justifyContent="space-between" pb={2}>
                    <Typography variant="h4">Setup position</Typography>
                    <Button variant="outlined" onClick={onExit}>Exit</Button>
                </Stack>
                <FormControl>
                    <FormLabel id="radio-side">Side</FormLabel>
                    <RadioGroup
                        aria-labelledby="radio-side"
                        defaultValue="w"
                        name="radio-side"
                    >
                        <FormControlLabel value="w" control={<Radio />} label="White" onChange={_ => setColor("w")}/>
                        <FormControlLabel value="b" control={<Radio />} label="Black" onChange={_ => setColor("b")}/>
                    </RadioGroup>
                </FormControl>
                <BoardEditor color={color} onUpdate={setPosition} size={size} />
                <Stack direction="row" justifyContent="space-between" pt={2} spacing={4} >
                    <Button disabled={!positionIsValid} sx={{mt: 1, py: 1, flexGrow: 1 }} variant="contained" onClick={onAddClick}>Add</Button>
                    { (positions.length > 0) ? <Button sx={{mt: 1, py: 1 }} variant="outlined" onClick={() => setAdding(false)}>Cancel</Button> : null }
                </Stack>
            </Stack>
        </Container>
    } else {
        return <Container maxWidth='lg' sx={{ pt: 6 }}>
                <Stack direction="row" justifyContent="space-between" pb={2}>
                    <Typography variant="h4">Select position</Typography>
                    <Button variant="outlined" onClick={onExit}>Exit</Button>
                </Stack>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                { positions.map(position => <EndgamePositionCard
                        width={250}
                        key={position.id} 
                        position={position}
                        onSelect={onSelect}
                        onDelete={onDelete}
                    />)
                }
            </Box>
            <Button sx={{mt: 10, px: 10, py: 1, flexGrow: 1 }} variant="contained" onClick={() => setAdding(true)}>Add new position</Button>
        </Container>
    }
}

export default EndgamePositionSelector

