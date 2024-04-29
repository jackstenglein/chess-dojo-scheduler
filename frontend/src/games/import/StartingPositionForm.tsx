import { useState } from 'react';

import { MenuItem } from '@mui/base';
import { Stack, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';

import { DateTime } from 'luxon';

import { GameSubmissionType, RemoteGame } from '../../api/gameApi';
import { getGameHeader } from '../edit/SubmitGamePreflight';
import { ImportButton } from './ImportButton';

interface StartingPositionFormProps {
    loading: boolean;
    onSubmit: (game: RemoteGame) => void;
}

export const StartingPositionForm: React.FC<StartingPositionFormProps> = ({
    loading,
    onSubmit,
}) => {
    const [white, setWhite] = useState('');
    const [black, setBlack] = useState('');
    const [date, setDate] = useState<DateTime | null>(null);
    const [result, setResult] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};

        if (white.trim() === '') {
            newErrors.white = 'This field is required';
        }

        if (black.trim() === '') {
            newErrors.black = 'This field is required';
        }

        if (!date || !date.isValid) {
            newErrors.date = 'This field is required';
        }

        if (result.trim() === '') {
            newErrors.result = 'This field is required';
        }
        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        onSubmit({
            type: GameSubmissionType.StartingPosition,
            headers: [getGameHeader({ white, black, date, result })],
        });
    };

    return (
        <Stack alignItems='flex-end' spacing={2}>
            <Stack
                direction='row'
                spacing={1}
                alignItems='baseline'
                justifyContent='space-between'
            >
                <TextField
                    fullWidth
                    data-cy={`white`}
                    label='White'
                    value={white}
                    onChange={(e) => setWhite(e.target.value)}
                    error={!!errors.white}
                    helperText={errors.white}
                />

                <TextField
                    fullWidth
                    data-cy={`black`}
                    label='Black'
                    value={black}
                    onChange={(e) => setBlack(e.target.value)}
                    error={!!errors.black}
                    helperText={errors.black}
                />

                <TextField
                    fullWidth
                    select
                    data-cy={`result`}
                    label='Result'
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    error={!!errors.result}
                    helperText={errors.result}
                >
                    <MenuItem value='1-0'>White Won</MenuItem>
                    <MenuItem value='1/2-1/2'>Draw</MenuItem>
                    <MenuItem value='0-1'>Black Won</MenuItem>
                </TextField>

                <DatePicker
                    label='Date'
                    disableFuture
                    value={date}
                    onChange={(newValue) => setDate(newValue)}
                    slotProps={{
                        textField: {
                            id: `date`,
                            error: !!errors.date,
                            helperText: errors.date,
                            fullWidth: true,
                        },
                    }}
                />
            </Stack>
            <ImportButton loading={loading} onClick={handleSubmit} />
        </Stack>
    );
};
