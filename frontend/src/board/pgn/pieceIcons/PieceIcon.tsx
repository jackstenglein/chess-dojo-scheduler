import { Box } from '@mui/material';

const imageUrls: Record<string, string> = {
    p: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/P.svg',
    n: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/N.svg',
    b: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/B.svg',
    r: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/R.svg',
    q: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/Q.svg',
    P: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/P.svg',
    N: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/N.svg',
    B: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/B.svg',
    R: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/R.svg',
    Q: 'https://lichess1.org/assets/_SQ9ycq/piece/mono/Q.svg',
};

const margins: Record<string, string> = {
    p: '-7px',
    n: '-4px',
    b: '-3px',
    r: '-4px',
    q: '-3px',
    P: '-7px',
    N: '-4px',
    B: '-3px',
    R: '-4px',
    Q: '-3px',
};

const PieceIcon: React.FC<{ piece: string }> = ({ piece }) => {
    return (
        <Box
            sx={{
                height: 0.8,
                aspectRatio: 1,
                marginLeft: margins[piece],
                backgroundImage: `url(${imageUrls[piece]})`,
                backgroundSize: 'cover',
                ':first-of-type': {
                    marginLeft: 0,
                },
            }}
        />
    );
};

export default PieceIcon;
