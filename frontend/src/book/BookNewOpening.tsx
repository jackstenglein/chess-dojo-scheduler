import { Color, newOpeningBook } from '@bendk/chess-tree'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Box, FormControl, FormLabel, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material';
import BookBoard from './BookBoard';
import BookBoardControls from './BookBoardControls';
import BookLine from './BookLine';
import { putBook } from '../api/bookApi';
import { ChessContext, ChessContextType } from '../board/pgn/PgnBoard';

const BookNewOpening = () => {
    const [moves, setMoves] = useState<string[]>([])
    const [chessContext, setChessContext] = useState<ChessContextType>({
        chess: undefined,
        board: undefined,
        config: {
            allowMoveDeletion: false,
        },
    });
    const [name, setName] = useState("")
    const [color, setColor] = useState<Color>("w")

    const navigate = useNavigate()
    const addBook = () => {
        const book = newOpeningBook(name, color, moves)
        putBook('test-user', book).then(() => {
            navigate(`/book/books/${book.id}`)
        })
    }

    return <ChessContext.Provider value={chessContext}>
        <Box sx={{
            py: 5,
            mx: 5,
            '--board-size': 'calc(min(600px, 100vw - 10px))',
            maxWidth: 'var(--board-size)',
            margin: 'auto',
        }}>
            <Typography variant="h4" mb={2}>Adding New Opening Book</Typography>
            <FormControl>
                <Typography variant="h5">Initial moves</Typography>
                <BookBoard
                    onInitialize={(board, chess) => setChessContext({...chessContext, board, chess})}
                    initialPosition="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                    size="var(--board-size)"
                    onMovesChange={setMoves}
                />
                <BookBoardControls onMovesChange={setMoves} />
                <BookLine moves={moves} />
            </FormControl>
            <Stack spacing={5} maxWidth={600}>
                <TextField label="Name" variant="standard" fullWidth onChange={e => {setName(e.target.value)}} />
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
            </Stack>
            <Stack direction="row" justifyContent="space-between" mt={10}>
                <Button onClick={addBook} disabled={name === ""} variant="contained" sx={{ px: 15, py: 2}}>Add</Button>
                <Button component={RouterLink} to="/book/books/" variant="outlined" sx={{ px: 5, py: 2}}>Cancel</Button>
            </Stack>

        </Box>
    </ChessContext.Provider>
};

export default BookNewOpening;
