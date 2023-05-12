import { Stack, Typography } from '@mui/material';

const ModelGamesTab = () => {
    return (
        <Stack spacing={2}>
            <Typography>
                0-1000:{' '}
                <a
                    href='https://lichess.org/study/vYjUuqv5'
                    target='_blank'
                    rel='noreferrer'
                >
                    https://lichess.org/study/vYjUuqv5
                </a>
            </Typography>

            <Typography>
                1000-1600:{' '}
                <a
                    href='https://lichess.org/study/C8p9wrjm'
                    target='_blank'
                    rel='noreferrer'
                >
                    https://lichess.org/study/C8p9wrjm
                </a>
            </Typography>

            <Typography>
                1600-2000:{' '}
                <a
                    href='https://lichess.org/study/8E6BKHLe'
                    target='_blank'
                    rel='noreferrer'
                >
                    https://lichess.org/study/8E6BKHLe
                </a>
            </Typography>

            <Typography>
                2000+:{' '}
                <a
                    href='https://lichess.org/study/y3wo9r8O'
                    target='_blank'
                    rel='noreferrer'
                >
                    https://lichess.org/study/y3wo9r8O
                </a>
            </Typography>
        </Stack>
    );
};

export default ModelGamesTab;
