import { MenuItem, Stack, TextField } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { OpenClassical } from '../../../database/tournament';
import PairingsTable from '../PairingsTable';
import Editor from './Editor';
import EmailPairingsButton from './EmailPairingsButton';

interface PairingsTabProps {
    openClassical: OpenClassical;
    onUpdate: (openClassical: OpenClassical) => void;
}

const PairingsTab: React.FC<PairingsTabProps> = ({ openClassical, onUpdate }) => {
    const [searchParams, setSearchParams] = useSearchParams({
        region: 'A',
        ratingRange: 'Open',
        view: '1',
    });
    const updateSearchParams = (key: string, value: string) => {
        const updatedParams = new URLSearchParams(searchParams.toString());
        updatedParams.set(key, value);
        setSearchParams(updatedParams);
    };

    const region = searchParams.get('region') || 'A';
    const ratingRange = searchParams.get('ratingRange') || 'Open';
    const view = searchParams.get('view') || '1';

    const round =
        openClassical.sections[`${region}_${ratingRange}`]?.rounds[parseInt(view) - 1];

    const maxRound =
        openClassical.sections[`${region}_${ratingRange}`]?.rounds.length ?? 1;

    return (
        <Stack spacing={3}>
            <Stack direction='row' spacing={2}>
                <Editor openClassical={openClassical} onSuccess={onUpdate} />
                <EmailPairingsButton
                    maxRound={maxRound}
                    currentRound={parseInt(view)}
                    emailsSent={round?.pairingEmailsSent}
                    onSuccess={onUpdate}
                />
            </Stack>

            <Stack direction='row' width={1} spacing={2}>
                <TextField
                    label='Region'
                    select
                    value={region}
                    onChange={(e) => updateSearchParams('region', e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <MenuItem value='A'>Region A (Americas)</MenuItem>
                    <MenuItem value='B'>Region B (Eurasia/Africa/Oceania)</MenuItem>
                </TextField>

                <TextField
                    data-cy='section'
                    label='Section'
                    select
                    value={ratingRange}
                    onChange={(e) => updateSearchParams('ratingRange', e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <MenuItem value='Open'>Open</MenuItem>
                    <MenuItem value='U1800'>U1800</MenuItem>
                </TextField>

                <TextField
                    label='Round'
                    select
                    value={view}
                    onChange={(e) => updateSearchParams('view', e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    {Array(maxRound)
                        .fill(0)
                        .map((_, i) => (
                            <MenuItem key={i + 1} value={`${i + 1}`}>
                                Round {i + 1}
                            </MenuItem>
                        ))}
                </TextField>
            </Stack>

            <PairingsTable
                openClassical={openClassical}
                region={region}
                ratingRange={ratingRange}
                round={parseInt(view)}
            />
        </Stack>
    );
};

export default PairingsTab;
