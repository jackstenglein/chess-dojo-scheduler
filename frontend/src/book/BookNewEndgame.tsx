import { newEndgameBook } from '@bendk/chess-tree'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Box, Stack, TextField, Typography } from '@mui/material';
import { putBook } from '../api/bookApi';

const BookNewOpening = () => {
    const [name, setName] = useState("")

    const navigate = useNavigate()
    const addBook = () => {
        const book = newEndgameBook(name)
        putBook('test-user', book).then(() => {
            navigate(`/book/books/${book.id}`)
        })
    }

    return <Box sx={{
            py: 5,
            mx: 5,
            '--board-size': 'calc(min(600px, 100vw - 10px))',
            maxWidth: 'var(--board-size)',
            margin: 'auto',
        }}>
        <Typography variant="h4" mb={2}>Adding New Endgame Book</Typography>
        <Stack spacing={5} maxWidth={600}>
            <TextField label="Name" variant="standard" fullWidth onChange={e => {setName(e.target.value)}} />
        </Stack>
        <Stack direction="row" justifyContent="space-between" mt={10}>
            <Button onClick={addBook} disabled={name === ""} variant="contained" sx={{ px: 15, py: 2}}>Add</Button>
            <Button component={RouterLink} to="/book/books/" variant="outlined" sx={{ px: 5, py: 2}}>Cancel</Button>
        </Stack>

    </Box>
};

export default BookNewOpening;
