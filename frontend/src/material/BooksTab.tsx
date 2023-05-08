import { Divider, Stack, Typography } from '@mui/material';
import { Book as BookModel, sections } from './books';

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

const BooksTab = () => {
    return (
        <Stack spacing={3}>
            {sections.map((s) => (
                <Stack key={s.title} spacing={2}>
                    <Stack>
                        <Typography variant='h6'>{s.title}</Typography>
                        <Divider />
                    </Stack>
                    {s.cohorts.map((c) => (
                        <Stack key={c.cohort} alignItems='start'>
                            <Typography
                                variant='subtitle1'
                                fontWeight='bold'
                                color='text.secondary'
                            >
                                {c.cohort}
                            </Typography>
                            {c.books.map((b) => (
                                <Book book={b} />
                            ))}
                        </Stack>
                    ))}
                </Stack>
            ))}
        </Stack>
    );
};

export default BooksTab;
