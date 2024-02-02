import { BookSummary, TrainingSelection } from '@bendk/chess-tree'
import { useCallback, useState } from 'react'
import {
    Button,
    Checkbox,
    List,
    ListItem,
    ListItemIcon,
    ListItemButton,
    ListItemText,
    Stack,
} from '@mui/material'

export interface NewTrainingOpeningProps {
    books: BookSummary[];
    onStart: (selection: TrainingSelection) => void;
}

const NewTrainingOpening: React.FC<NewTrainingOpeningProps> = ({books, onStart}) => {
    const [selection, setSelection] = useState<string[]>([])

    const toggleSelection = useCallback((bookId: string) => {
        const index = selection.indexOf(bookId)
        if (index === -1) {
            setSelection([...selection, bookId])
        } else {
            setSelection([...selection.slice(0, index), ...selection.slice(index+1)])
        }
    }, [selection, setSelection])

    const onStartClick = useCallback(() => {
        if(selection.length > 0) {
            onStart({ type: "manual", books: selection })
        }
    }, [selection, onStart])

    return <Stack spacing={2}>
        <List>
            { books.map(book => {
                const labelId = `toggle-${book.id}`
                return <ListItem key={book.id}>
                    <ListItemButton role={undefined} onClick={() => toggleSelection(book.id)} dense>
                        <ListItemIcon>
                            <Checkbox
                                edge="start"
                                checked={selection.indexOf(book.id) !== -1}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': labelId }}
                            />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={book.name} />
                    </ListItemButton>

                </ListItem>
            })}
        </List>
        <Stack pt={4}>
            <Button variant="contained" onClick={onStartClick} sx={{ py: 2 }}>Start training</Button>
        </Stack>
    </Stack>
}

export default NewTrainingOpening

