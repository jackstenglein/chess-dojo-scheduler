import { BookSummary, TrainingSelection, newTraining } from '@bendk/chess-tree'
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Button,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    Container,
    Typography
} from '@mui/material';
import { listBooks, putTraining } from '../../api/bookApi'
import LoadingPage from '../../loading/LoadingPage';
import NewTrainingManual from './NewTrainingManual'
import NewTrainingOpening from './NewTrainingOpening'

const NewTrainingPage = () => {
    const [type, setType] = useState<"all"|"opening"|"endgame"|"manual">("all")
    const [books, setBooks] = useState<BookSummary[]|null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        listBooks('test-user').then(setBooks)
    }, [])

    const onStart = useCallback(async (selection?: TrainingSelection) => {
        if (selection === undefined) {
            if (type === "endgame" || type === "all") {
                selection = { type }
            } else {
                throw Error(`NewTrainingPage.onStart: selection must be passed in when type=${type}`)
            }
        }
        if (books !== null) {
            const training = newTraining(books, selection!)
            await putTraining('test-user', training)
            navigate(`/book/training/${training.id}`)
        }
    }, [books, type, navigate])

    if (books === null) {
        return <LoadingPage />
    }

    let bottom = <Stack pt={4}><Button variant="contained" onClick={() => onStart()} sx={{ py: 2 }}>Start training</Button></Stack>
    if (type === "opening") {
        bottom = <NewTrainingOpening onStart={onStart} />
    } else if (type === "manual") {
        bottom = <NewTrainingManual onStart={onStart} books={books} />
    }

    return <Container maxWidth='lg' sx={{ py: 5 }}>
        <Stack direction="row" justifyContent="space-between">
            <Typography variant="h4">Start new training</Typography>
            <Button variant="outlined" component={RouterLink} to="/book" sx={{ py: 2 }}>Cancel</Button>
        </Stack>
        <Stack spacing={2} maxWidth="600px">
            <Stack pt={1} spacing={2}>
                <FormControl>
                    <FormLabel id="radio-type">Training Type</FormLabel>
                    <RadioGroup row aria-labelledby="radio-type" value={type} name="radio-type">
                        <FormControlLabel value="all" control={<Radio />} label="All books" onChange={_ => setType("all")}/>
                        <FormControlLabel value="endgame" control={<Radio />} label="All Endgames" onChange={_ => setType("endgame")}/>
                        <FormControlLabel value="opening" control={<Radio />} label="Openings" onChange={_ => setType("opening")}/>
                        <FormControlLabel value="manual" control={<Radio />} label="Select books" onChange={_ => setType("manual")}/>
                    </RadioGroup>
                </FormControl>
            </Stack>
            {bottom}
        </Stack>
    </Container>
}

export default NewTrainingPage
