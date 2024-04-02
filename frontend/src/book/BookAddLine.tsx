import { isEqual } from 'lodash'
import { BookSummary, NodeReducer, Move, OpeningBookSummary } from '@bendk/chess-tree'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Box, FormControl, FormLabel, FormControlLabel, Paper, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import BookBoard from './BookBoard';
import BookBoardControls from './BookBoardControls';
import BookLine from './BookLine';
import { getBook, listBooks, putBook } from '../api/bookApi';
import { ChessContext, ChessContextType } from '../board/pgn/PgnBoard';
import { reconcile } from '../board/Board';
import LoadingPage from '../loading/LoadingPage'

const BookNewOpening = () => {
    const navigate = useNavigate()
    const [books, setBooks] = useState<BookSummary[]|null>(null)
    const [selectedBookId, setSelectedBookId] = useState<string|null>(null)
    const [moves, setMoves] = useState<string[]>([])
    const [chessContext, setChessContext] = useState<ChessContextType>({
        chess: undefined,
        board: undefined,
        config: {
            allowMoveDeletion: false,
        },
    });

    const openingBooks = books?.filter(b => b.type === "opening") as OpeningBookSummary[] ?? []
    const matches = openingBooks.filter(b => isEqual(b.initialMoves, moves.slice(0, b.initialMoves.length)))
    const potentialMatches = openingBooks.filter(b => isEqual(moves, b.initialMoves.slice(0, moves.length)))
    potentialMatches.sort()
    potentialMatches.splice(3)

    const selectedBook = matches.find(b => b.id === selectedBookId)
    const movesToAdd = useMemo(() => {
        if (selectedBook === undefined) {
            return []
        } else {
            return moves.slice(selectedBook.initialMoves.length)
        }
    }, [selectedBook, moves])

    useEffect(() => {
        listBooks('test-user').then(setBooks)
    }, [])
    const updateMoves = useCallback((moves: Move[]) => {
        setMoves(moves)
        if (chessContext.chess) {
            chessContext.chess.load("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
            for(const move of moves) {
                chessContext.chess.move(move)
            }
            reconcile(chessContext.chess, chessContext.board)
        }
    }, [setMoves, chessContext])
    const addLine = useCallback(() => {
        if(selectedBookId !== null) {
            getBook('test-user', selectedBookId)
                .then(book => {
                    if (book === undefined) {
                        throw Error(`Book not found: ${selectedBookId}`)
                    }
                    if (book.type !== "opening") {
                        throw Error(`Not opening book: ${selectedBookId}`)
                    }
                    let state = NodeReducer.initialState(book.rootNode)
                    state = NodeReducer.reduce(state, {
                        type: 'add',
                        moves: movesToAdd,
                    })
                    putBook('test-user', {
                        ...book,
                        rootNode: state.node,
                    }).then(() => navigate("/book"))
                })
        }
    }, [selectedBookId, movesToAdd, navigate])

    useEffect(() => {
        if (matches.length === 1) {
            setSelectedBookId(matches[0].id)
        } else if (selectedBookId !== null && matches.find(b => b.id === selectedBookId) === undefined) {
            setSelectedBookId(null)
        }
    }, [selectedBookId, setSelectedBookId, matches])

    if (books === null) {
        return <LoadingPage />
    }


    let bookSelection
    if (matches.length > 0) {
        bookSelection = <FormControl>
            <FormLabel id="book-select">Book</FormLabel>
            <RadioGroup
                aria-labelledby="book-select"
                name="book-select"
                value={selectedBookId}
            >
                { matches.map(book => <FormControlLabel
                        key={ book.id }
                        value={ book.id }
                        control={<Radio />}
                        label={book.name}
                        onChange={_ => setSelectedBookId(book.id)}
                    />)
                }
            </RadioGroup>
        </FormControl>
    } else if (potentialMatches.length > 0) {
        bookSelection = <Stack>
            <Typography variant="h5">Matching books:</Typography>
                {
                potentialMatches.map(book => <Stack key={book.id} direction="row">
                    <Typography fontWeight="bold" variant="h6" pr={2}>{ book.name }:</Typography>
                    <BookLine moves={book.initialMoves} variant="body1" onClick={updateMoves} />
                </Stack>)
            }
        </Stack>
    } else {
        bookSelection = <Paper sx={{p: 2, pb: 1.5 }}><Typography fontStyle="italic" variant="h6">No books match</Typography></Paper>
    }

    return <ChessContext.Provider value={chessContext}>
        <Box sx={{
            py: 5,
            mx: 5,
            '--board-size': 'calc(min(600px, 100vw - 10px))',
            maxWidth: 'var(--board-size)',
            margin: 'auto',
        }}>
            <Typography variant="h4" mb={2}>Add Line to an Opening Book</Typography>
            <Stack spacing={2}>
                <FormControl>
                    <BookBoard
                        onInitialize={(board, chess) => setChessContext({...chessContext, board, chess})}
                        initialPosition="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                        size="var(--board-size)"
                        onMovesChange={setMoves}
                    />
                    <BookBoardControls onMovesChange={setMoves} />
                </FormControl>
                { bookSelection} 
                { movesToAdd.length > 0 ?
                    <FormControl>
                        <FormLabel>Moves to add</FormLabel>
                        <BookLine moves={movesToAdd} />
                    </FormControl> :
                    null
                }
            </Stack>
            <Stack direction="row" justifyContent="space-between" mt={10}>
                <Button onClick={addLine} disabled={movesToAdd.length === 0} variant="contained" sx={{ px: 15, py: 2}}>Add Line</Button>
                <Button component={RouterLink} to="/book/" variant="outlined" sx={{ px: 5, py: 2}}>Cancel</Button>
            </Stack>

        </Box>
    </ChessContext.Provider>
};

export default BookNewOpening;
