import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import StarIcon from '@mui/icons-material/Star';
import {
    Box,
    Collapse,
    Container,
    Divider,
    IconButton,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { Book as BookModel, BookSection, sections } from './books';

function getDisplayTitle(b: BookModel) {
    if (b.author) {
        return `${b.author} - ${b.title}`;
    }
    return b.title;
}

const Book: React.FC<{ book: BookModel }> = ({ book }) => {
    if (book.link) {
        return (
            <Link href={book.link} target='_blank' rel='noreferrer'>
                <Typography>{getDisplayTitle(book)}</Typography>
            </Link>
        );
    }
    return <Typography>{getDisplayTitle(book)}</Typography>;
};

interface SectionProps {
    section: BookSection;
}

const Section: React.FC<SectionProps> = ({ section }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => {
        setOpen(!open);
    };

    return (
        <Box>  
            <Stack direction='row' alignItems='center'>
                <IconButton size='small' onClick={toggleOpen}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
                <Typography variant='h6' onClick={toggleOpen} sx={{ cursor: 'pointer' }}>
                   <StarIcon/> {section.title}
                </Typography>
            </Stack>
            <Divider />

            <Collapse in={open} timeout='auto'>
                <Stack spacing={2} mt={2}>
                    {section.cohorts.map((c) => (
                        <Stack key={c.cohort} alignItems='start'>
                            <Typography
                                variant='subtitle1'
                                fontWeight='bold'
                                color='text.secondary'
                            >
                                {c.cohort}
                            </Typography>
                            {c.books.map((b) => (
                                <Book key={b.title} book={b} />
                            ))}
                        </Stack>
                    ))}
                </Stack>
            </Collapse>
        </Box>
    );
};

const BooksPage = () => {
    return (
        <Container sx={{ py: 3 }}>
            <Typography variant='h5' align='center'> <AutoStoriesIcon/> ChessDojo Recommended Books </Typography>
            <Container sx={{ py: 3 }}>
            <Typography > The following books have been handpicked by the Senseis for each cohort. Below you'll see the list of books that are assigned for each rating band, split among the main recommendations, tactics books, and endgame books. </Typography>
            </Container>
            <Container sx={{ py: 1 }}>
            <Stack spacing={3}>
                {sections.map((s) => (
                    <Section key={s.title} section={s} />
                ))}
            </Stack>
        </Container>
        </Container>
    );
};

export default BooksPage;
