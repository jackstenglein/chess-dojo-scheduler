import { Chess } from '@jackstenglein/chess';
import {
    Autocomplete,
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useRequirements } from '../../api/cache/requirements';
import { GameSubmissionType } from '../../api/gameApi';
import { useFreeTier } from '../../auth/Auth';
import Board from '../../board/Board';
import { ALL_COHORTS } from '../../database/user';
import { ImportButton } from './ImportButton';
import { ImportDialogProps } from './ImportWizard';

interface PositionFormOption {
    label: string;
    fen: string;
    id: string;
    category: string;
    sortPriority: string;
}

export const PositionForm = ({ loading, onSubmit, onClose }: ImportDialogProps) => {
    const [fen, setFen] = useState<string>('');
    const [error, setError] = useState<string>('');

    const isFreeTier = useFreeTier();
    const { requirements } = useRequirements(ALL_COHORTS, true);
    const positions = useMemo(() => {
        return requirements.flatMap((requirement) => {
            if (isFreeTier && !requirement.isFree) {
                return [];
            }

            return (
                requirement.positions?.map((position) => ({
                    label: `${requirement.name} - ${position.title}`,
                    fen: position.fen,
                    id: `${requirement.id}-${position.title}`,
                    category: requirement.category,
                    sortPriority: requirement.sortPriority,
                })) ?? []
            );
        });
    }, [requirements, isFreeTier]);

    const getOptionLabel = (option: string | PositionFormOption) => {
        if (typeof option === 'string') {
            return option;
        }

        return option.label;
    };

    const changeFen = (
        _: React.SyntheticEvent,
        value: string | PositionFormOption | null,
    ) => {
        setError('');

        if (!value) {
            setFen('');
        } else if (typeof value === 'string') {
            setFen(value);
        } else {
            setFen(value.fen);
        }
    };

    const handleSubmit = () => {
        try {
            const chess = new Chess({ fen });
            onSubmit({
                pgnText: chess.pgn.render(),
                type: GameSubmissionType.Fen,
            });
        } catch (err) {
            setError('Invalid FEN');
        }
    };

    return (
        <>
            <DialogTitle>Custom Position</DialogTitle>
            <DialogContent>
                <Stack mt={0.8} spacing={2} alignItems='center'>
                    <Autocomplete
                        sx={{ width: 1 }}
                        options={positions}
                        getOptionLabel={getOptionLabel}
                        groupBy={(option) => option.category}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label='Choose Position or Paste FEN'
                                error={!!error}
                                helperText={error}
                            />
                        )}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        onChange={changeFen}
                        onInputChange={(_e, value) => {
                            setFen(value);
                        }}
                        data-cy='position-entry'
                        freeSolo
                        selectOnFocus
                        blurOnSelect
                    />

                    <Box sx={{ aspectRatio: 1, width: '100%', maxWidth: '336px' }}>
                        <Board
                            key={fen}
                            config={{
                                fen,
                                viewOnly: true,
                            }}
                        />
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <ImportButton loading={loading} onClick={handleSubmit} />
            </DialogActions>
        </>
    );
};
