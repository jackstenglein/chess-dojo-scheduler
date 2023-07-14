import { Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import GraduationIcon from '../../scoreboard/GraduationIcon';
import { Game } from '../../database/game';

interface TagsProps {
    tags?: Record<string, string>;
    game?: Game;
}

const Tags: React.FC<TagsProps> = ({ tags, game }) => {
    if (!tags) {
        return null;
    }

    return (
        <Table>
            <TableBody>
                {game && game.ownerDisplayName !== '' && (
                    <TableRow>
                        <TableCell>Uploaded By</TableCell>
                        <TableCell>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <Link to={`/profile/${game.owner}`}>
                                    <Typography variant='body2'>
                                        {game.ownerDisplayName}
                                    </Typography>
                                </Link>
                                <GraduationIcon
                                    cohort={game.ownerPreviousCohort}
                                    size={20}
                                />
                            </Stack>
                        </TableCell>
                    </TableRow>
                )}

                {Object.entries(tags).map(([key, value]) => (
                    <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{value}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default Tags;
