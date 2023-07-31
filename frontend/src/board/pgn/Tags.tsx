import { useEffect, useState } from 'react';
import {
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { EventType } from '@jackstenglein/chess';
import { Link } from 'react-router-dom';

import GraduationIcon from '../../scoreboard/GraduationIcon';
import { Game } from '../../database/game';
import { useChess } from './PgnBoard';

export const TagTextFieldId = 'tagEditor';

interface TagsProps {
    tags?: Record<string, string>;
    game?: Game;
    allowEdits?: boolean;
}

interface TagProps {
    name: string;
    value: string;
    allowEdits?: boolean;
}

const Tag: React.FC<TagProps> = ({ name, value, allowEdits }) => {
    const chess = useChess().chess;

    const handleChange = (newValue: string) => {
        chess?.setHeader(name, newValue);
    };

    const deleteTag = () => {
        chess?.setHeader(name);
    };

    return (
        <TableRow>
            <TableCell>{name}</TableCell>
            <TableCell>
                {allowEdits ? (
                    <TextField
                        id={TagTextFieldId}
                        variant='standard'
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                    />
                ) : (
                    value
                )}
            </TableCell>

            {allowEdits && (
                <TableCell>
                    <Tooltip title='Delete Tag'>
                        <IconButton onClick={deleteTag}>
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </TableCell>
            )}
        </TableRow>
    );
};

const NewTag = () => {
    const chess = useChess().chess;
    const [name, setName] = useState('');
    const [value, setValue] = useState('');

    const normalizeValue = (value: string) => {
        return value.trim().replaceAll('"', '');
    };

    const onAdd = () => {
        if (name === '' || value === '') {
            return;
        }

        chess?.setHeader(name, value);
        setName('');
        setValue('');
    };

    return (
        <TableRow>
            <TableCell>
                <TextField
                    id={TagTextFieldId}
                    variant='standard'
                    label='Tag Name'
                    value={name}
                    onChange={(e) => setName(normalizeValue(e.target.value))}
                />
            </TableCell>
            <TableCell>
                <TextField
                    id={TagTextFieldId}
                    variant='standard'
                    label='Tag Value'
                    value={value}
                    onChange={(e) => setValue(normalizeValue(e.target.value))}
                />
            </TableCell>
            <TableCell>
                <Tooltip title='Add Tag'>
                    <IconButton onClick={onAdd}>
                        <AddCircleIcon />
                    </IconButton>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
};

const Tags: React.FC<TagsProps> = ({ game, allowEdits }) => {
    const chess = useChess().chess;
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.UpdateHeader],
                handler: () => {
                    setForceRender((v) => v + 1);
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess]);

    const tags = chess?.pgn.header.tags;
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
                        {allowEdits && <TableCell></TableCell>}
                    </TableRow>
                )}

                {Object.entries(tags).map(([key, value]) => (
                    <Tag key={key} name={key} value={value} allowEdits={allowEdits} />
                ))}

                {allowEdits && <NewTag />}
            </TableBody>
        </Table>
    );
};

export default Tags;
