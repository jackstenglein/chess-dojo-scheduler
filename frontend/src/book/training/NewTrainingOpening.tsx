import { Color, TrainingSelection } from '@bendk/chess-tree'
import { useCallback, useState } from 'react'
import {
    Button,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
} from '@mui/material'
import { ChessContext, ChessContextType } from '../../board/pgn/PgnBoard';
import BookBoard from "../BookBoard"
import BookBoardControls from "../BookBoardControls"
import BookLine from "../BookLine"

export interface NewTrainingOpeningProps {
    onStart: (selection: TrainingSelection) => void;
}

const NewTrainingOpening: React.FC<NewTrainingOpeningProps> = ({onStart}) => {
    const [color, setColor] = useState<Color|"both">("both")
    const [moves, setMoves] = useState<string[]>([])
    const [chessContext, setChessContext] = useState<ChessContextType>({
        chess: undefined,
        board: undefined,
        config: {
            allowMoveDeletion: false,
        },
    });

    const onStartClick = useCallback(() => {
        const selection: TrainingSelection = {
            type: "opening"
        }
        if (color !== "both") {
            selection.color = color
        }
        if (moves.length > 0) {
            selection.initialMoves = moves
        }
        onStart(selection)
    }, [onStart, color, moves])

    return <ChessContext.Provider value={chessContext}>
        <Stack spacing={2}>
            <FormControl>
                <FormLabel id="radio-color">Color</FormLabel>
                <RadioGroup row aria-labelledby="radio-color" value={color} name="radio-color">
                    <FormControlLabel value="both" control={<Radio />} label="Both" onChange={_ => setColor("both")}/>
                    <FormControlLabel value="w" control={<Radio />} label="White" onChange={_ => setColor("w")}/>
                    <FormControlLabel value="b" control={<Radio />} label="Black" onChange={_ => setColor("b")}/>
                </RadioGroup>
            </FormControl>
            <FormControl>
                <FormLabel id="radio-color">Staring moves</FormLabel>
                <BookBoard size={600} onInitialize={(board, chess) => setChessContext({...chessContext, board, chess})} onMovesChange={setMoves} />
                <BookBoardControls onMovesChange={setMoves} />
                <BookLine moves={moves} />
            </FormControl>
            <Stack pt={4}>
                <Button variant="contained" onClick={onStartClick} sx={{ py: 2 }}>Start training</Button>
            </Stack>
        </Stack>
    </ChessContext.Provider>
}

export default NewTrainingOpening

