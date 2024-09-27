import {
    ENGINE_DEPTH_KEY,
    ENGINE_LINE_COUNT_KEY,
    ENGINE_NAME_KEY,
    EngineName,
    engines,
} from '@/stockfish/engine/engine';
import SettingsIcon from '@mui/icons-material/Settings';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid2,
    IconButton,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import Slider from './Slider';

export default function Settings() {
    const [open, setOpen] = useState(false);
    const [depth, setDepth] = useLocalStorage(ENGINE_DEPTH_KEY, 16);
    const [multiPv, setMultiPv] = useLocalStorage(ENGINE_LINE_COUNT_KEY, 3);
    const [engineName, setEngineName] = useLocalStorage(
        ENGINE_NAME_KEY,
        EngineName.Stockfish17,
    );

    return (
        <>
            <IconButton
                title='Engine settings'
                color='primary'
                onClick={() => setOpen(true)}
                sx={{ alignSelf: 'flex-end' }}
            >
                <SettingsIcon fontSize='medium' />
            </IconButton>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
                <DialogTitle>Set engine parameters</DialogTitle>
                <DialogContent>
                    <Typography>
                        Stockfish 16 Lite (HCE) is the default engine. It offers the best
                        balance between speed and strength. Stockfish 16 is the strongest
                        engine available, note that it requires a one-time download of
                        40MB.
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
                                <InputLabel id='dialog-select-label'>Engine</InputLabel>
                                <Select
                                    labelId='dialog-select-label'
                                    id='dialog-select'
                                    displayEmpty
                                    input={<OutlinedInput label='Engine' />}
                                    value={engineName}
                                    onChange={(e) =>
                                        setEngineName(e.target.value as EngineName)
                                    }
                                    sx={{ width: 280, maxWidth: '100%' }}
                                >
                                    {engines.map((engine) => (
                                        <MenuItem key={engine.name} value={engine.name}>
                                            {engine.fullName}
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
                </DialogContent>
                <Button
                    variant='contained'
                    color='success'
                    onClick={() => setOpen(false)}
                    sx={{ m: 2 }}
                >
                    Done
                </Button>
            </Dialog>
        </>
    );
}
