import {
    Button,
    Card,
    CardContent,
    CardHeader,
    FormControl,
    Grid2,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Typography,
} from '@mui/material';
import { EngineName } from '../engine/engineEnum';
import {
    engineDepthAtom,
    engineMultiPvAtom,
    engineNameAtom,
} from '../engine/engineState';
import { useAtomLocalStorage } from '../hooks/useAtomLocalStorage';
import Slider from './Slider';

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function EngineSettingsCard({ onClose }: Props) {
    const [depth, setDepth] = useAtomLocalStorage('engine-depth', engineDepthAtom);
    const [multiPv, setMultiPv] = useAtomLocalStorage(
        'engine-multi-pv',
        engineMultiPvAtom,
    );
    const [engineName, setEngineName] = useAtomLocalStorage(
        'engine-name',
        engineNameAtom,
    );

    return (
        <Card sx={{ maxWidth: 600, margin: 'auto' }}>
            <CardHeader
                title='Set engine parameters'
                titleTypographyProps={{ variant: 'h5', marginY: 1 }}
            />
            <CardContent>
                <Typography>
                    Stockfish 16 Lite (HCE) is the default engine. It offers the best
                    balance between speed and strength. Stockfish 16 is the strongest
                    engine available, note that it requires a one-time download of 40MB.
                </Typography>
                <Grid2
                    marginTop={4}
                    container
                    justifyContent='center'
                    alignItems='center'
                    size={12}
                    rowGap={3}
                >
                    <Grid2 container size={12} justifyContent='center'>
                        <FormControl variant='outlined'>
                            <InputLabel id='card-select-label'>Engine</InputLabel>
                            <Select
                                labelId='card-select-label'
                                id='card-select'
                                displayEmpty
                                input={<OutlinedInput label='Engine' />}
                                value={engineName}
                                onChange={(e) =>
                                    setEngineName(e.target.value as EngineName)
                                }
                                sx={{ width: 280, maxWidth: '100%' }}
                            >
                                {Object.values(EngineName).map((engine) => (
                                    <MenuItem
                                        key={engine}
                                        value={engine}
                                        // disabled={
                                        //     engine.includes('stockfish_16')
                                        //         ? !Stockfish16.isSupported()
                                        //         : false
                                        // }
                                    >
                                        {engineLabel[engine]}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid2>

                    <Slider
                        label='Maximum depth'
                        value={depth}
                        setValue={setDepth}
                        min={10}
                        max={30}
                        marksFilter={2}
                    />

                    <Slider
                        label='Number of lines'
                        value={multiPv}
                        setValue={setMultiPv}
                        min={2}
                        max={6}
                        xs={6}
                    />
                </Grid2>
            </CardContent>
            <Button variant='contained' onClick={onClose} sx={{ m: 2 }}>
                Done
            </Button>
        </Card>
    );
}

const engineLabel: Record<EngineName, string> = {
    [EngineName.Stockfish16]: 'Stockfish 16.1 Lite (HCE)',
    [EngineName.Stockfish16NNUE]: 'Stockfish 16.1 (40MB download)',
    [EngineName.Stockfish11]: 'Stockfish 11 Lite',
};
