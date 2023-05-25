import { useState } from 'react';
import { Box, Collapse, Divider, IconButton, Stack, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

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
            <a href={book.link} target='_blank' rel='noreferrer'>
                <Typography>{getDisplayTitle(book)}</Typography>
            </a>
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
                    {section.title}
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

const BooksTab = () => {
    return (
        <Stack spacing={3}>
            {sections.map((s) => (
                <Section key={s.title} section={s} />
            ))}
        </Stack>
    );
};

export default BooksTab;
