import { useNavigate } from 'react-router-dom';
import { Stack, TableCell, TableRow, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';

import { GameInfo, GameResult } from '../database/game';

interface GameListItemProps {
    game: GameInfo;
}

const GameListItem: React.FC<GameListItemProps> = ({ game }) => {
    const navigate = useNavigate();

    const onClick = () => {
        navigate(`${game.cohort}/${game.id}`);
    };

    const moves = game.headers.PlyCount
        ? Math.ceil(parseInt(game.headers.PlyCount) / 2)
        : '?';

    return (
        <TableRow onClick={onClick} sx={{ cursor: 'pointer' }}>
            <TableCell>{game.cohort}</TableCell>

            <TableCell>
                <Stack>
                    <Stack direction='row' spacing={1}>
                        <CircleOutlinedIcon />
                        <Typography>
                            {game.white} ({game.headers.WhiteElo})
                        </Typography>
                    </Stack>

                    <Stack direction='row' spacing={1}>
                        <CircleIcon htmlColor='black' />
                        <Typography>
                            {game.black} ({game.headers.BlackElo})
                        </Typography>
                    </Stack>
                </Stack>
            </TableCell>

            <TableCell>
                <Stack alignItems='center'>
                    <Typography>
                        {game.headers.Result === GameResult.White && '1'}
                        {game.headers.Result === GameResult.Black && '0'}
                        {game.headers.Result === GameResult.Draw && '½'}
                    </Typography>
                    <Typography>
                        {game.headers.Result === GameResult.White && '0'}
                        {game.headers.Result === GameResult.Black && '1'}
                        {game.headers.Result === GameResult.Draw && '½'}
                    </Typography>
                </Stack>
            </TableCell>

            <TableCell align='center'>
                <Typography>{moves}</Typography>
            </TableCell>

            <TableCell align='right'>
                <Typography>{game.date}</Typography>
            </TableCell>
        </TableRow>
    );
};

export default GameListItem;
