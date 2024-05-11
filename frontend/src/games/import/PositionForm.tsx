import { useState } from 'react';

import { Chess } from '@jackstenglein/chess';
import {
    Autocomplete,
    Box,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    TextField,
} from '@mui/material';
import { useRequirements } from '../../api/cache/requirements';
import { GameSubmissionType, RemoteGame } from '../../api/gameApi';
import { useAuth } from '../../auth/Auth';
import Board from '../../board/Board';
import { ChessContext } from '../../board/pgn/PgnBoard';
import { ImportButton } from './ImportButton';

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface FENFieldProps {
    fen: string;
    changeFen: (fen: string) => void;
    error: string | null;
}

function FENField({ fen, changeFen, error }: FENFieldProps) {
    return (
        <TextField
            sx={{ flexGrow: 1 }}
            data-cy='fen-entry'
            label='FEN'
            value={fen}
            onChange={(e) => changeFen(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder={startingPositionFen}
            onFocus={(e) => {
                e.target.select();
            }}
        />
    );
}

interface RequirementPositionFieldProps {
    changeFen: (fen: string) => void;
    cohort: string;
}

const RequirementPositionField: React.FC<RequirementPositionFieldProps> = ({
    changeFen,
    cohort,
}) => {
    const { requirements } = useRequirements(cohort, true);

    const positions = requirements.flatMap((requirement) => {
        const reqPositions = requirement.positions;
        if (!reqPositions) {
            return [];
        }

        // For now skip requirmeents with mltiple positions
        if (reqPositions.length > 1) {
            return [];
        }

        const position = reqPositions[0];
        const label = `${requirement.name} - ${position.title}`;
        return {
            label,
            fen: position.fen,
            id: requirement.id,
        };
    });

    return (
        <Autocomplete
            sx={{ flexGrow: 1 }}
            disablePortal
            getOptionLabel={(option) => option.label}
            options={positions}
            renderInput={(params) => <TextField {...params} label='Position' />}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(_, value) => changeFen(value?.fen ?? '')}
        />
    );
};

interface PositionFormProps {
    loading: boolean;
    onSubmit: (game: RemoteGame) => void;
}

export const PositionForm: React.FC<PositionFormProps> = ({ loading, onSubmit }) => {
    const [fen, setFen] = useState<string>(startingPositionFen);
    const [error, setError] = useState<string | null>(null);
    const [by, setBy] = useState('starting');
    const [chess] = useState(new Chess());

    const auth = useAuth();

    const cohort = auth?.user?.dojoCohort;

    const changeFen = (fen: string) => {
        setError(null);
        setFen(fen);

        try {
            chess.load(fen);
        } catch {
            setError('Invalid FEN');
        }
    };

    const handleSubmit = () => {
        onSubmit({
            pgnText: chess.pgn.render(),
            type: GameSubmissionType.Manual,
        });
    };

    return (
        <Box>
            <Stack spacing={1}>
                <Box>
                    <RadioGroup
                        row
                        name='select-position-by'
                        onChange={(_, value) => setBy(value)}
                        value={by}
                    >
                        <FormControlLabel
                            value='starting'
                            control={<Radio />}
                            label='Starting Position'
                            data-cy='by-starting'
                            onClick={() => changeFen(startingPositionFen)}
                        />
                        {cohort && (
                            <FormControlLabel
                                value='requirement'
                                control={<Radio />}
                                label='Requirement'
                                data-cy='by-requirement'
                            />
                        )}
                        <FormControlLabel
                            value='fen'
                            control={<Radio />}
                            label='FEN'
                            data-cy='by-fen'
                        />
                    </RadioGroup>
                </Box>
                <Box display='flex' gap={1} sx={{ flexGrow: 1, maxWidth: '500px' }}>
                    {by === 'fen' && (
                        <FENField
                            key='by-fen'
                            changeFen={changeFen}
                            fen={fen}
                            error={error}
                        />
                    )}
                    {by === 'requirement' && cohort && (
                        <RequirementPositionField
                            key='by-position'
                            cohort={cohort}
                            changeFen={changeFen}
                        />
                    )}
                    <ImportButton
                        sx={{ alignSelf: 'flex-start' }}
                        loading={loading}
                        onClick={handleSubmit}
                    />
                </Box>
                <Box sx={{ aspectRatio: '1 / 1', maxWidth: '500px', height: 'auto' }}>
                    <ChessContext.Provider value={{ chess }}>
                        <Board
                            config={{
                                fen: chess.fen(),
                            }}
                        />
                    </ChessContext.Provider>
                </Box>
            </Stack>
        </Box>
    );
};
