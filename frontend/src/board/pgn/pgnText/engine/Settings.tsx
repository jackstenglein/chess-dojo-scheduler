import {
    ENGINE_DEPTH,
    ENGINE_HASH,
    ENGINE_LINE_COUNT,
    ENGINE_NAME,
    ENGINE_THREADS,
    EngineName,
    engines,
} from '@/stockfish/engine/engine';
import Icon from '@/style/Icon';
import SettingsIcon from '@mui/icons-material/Settings';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import Slider from './Slider';

export default function Settings() {
    const [open, setOpen] = useState(false);
    const [depth, setDepth] = useLocalStorage<number>(
        ENGINE_DEPTH.Key,
        ENGINE_DEPTH.Default,
    );
    const [multiPv, setMultiPv] = useLocalStorage<number>(
        ENGINE_LINE_COUNT.Key,
        ENGINE_LINE_COUNT.Default,
    );
    const [engineName, setEngineName] = useLocalStorage<EngineName>(
        ENGINE_NAME.Key,
        ENGINE_NAME.Default,
    );
    const [threads, setThreads] = useLocalStorage<number>(
        ENGINE_THREADS.Key,
        ENGINE_THREADS.Default,
    );
    const [hash, setHash] = useLocalStorage<number>(ENGINE_HASH.Key, ENGINE_HASH.Default);

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
                <DialogTitle>Engine Settings</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField
                            select
                            fullWidth
                            label='Engine'
                            value={engineName}
                            onChange={(e) => setEngineName(e.target.value as EngineName)}
                        >
                            {engines.map((engine) => (
                                <MenuItem key={engine.name} value={engine.name}>
                                    <Icon
                                        name={engine.name}
                                        sx={{ verticalAlign: 'middle', mr: 1 }}
                                        color='dojoOrange'
                                    />
                                    {engine.fullName}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Typography>
                            <Icon
                                name='info'
                                color='dojoOrange'
                                sx={{ mr: 0.3, verticalAlign: 'middle' }}
                            />
                            SF 17 NNUE best suited in desktop browsers, SF 16.1 NNUE best
                            for both mobile and desktop, SF 11 HCE (Hard Coded Eval) fast,
                            but not always accurate.
                        </Typography>

                        <Slider
                            label='Depth'
                            value={depth}
                            setValue={setDepth}
                            min={ENGINE_DEPTH.Min}
                            max={ENGINE_DEPTH.Max}
                            icon='depth'
                        />

                        <Slider
                            label='Lines'
                            value={multiPv}
                            setValue={setMultiPv}
                            min={ENGINE_LINE_COUNT.Min}
                            max={ENGINE_LINE_COUNT.Max}
                            icon='lines'
                        />

                        <Slider
                            label='Threads'
                            value={threads}
                            setValue={setThreads}
                            min={ENGINE_THREADS.Min}
                            max={ENGINE_THREADS.Max}
                            icon='thread'
                        />

                        <Slider
                            label='Memory'
                            value={hash}
                            setValue={setHash}
                            min={ENGINE_HASH.Min}
                            max={ENGINE_HASH.Max}
                            valueLabel={(v) => `${Math.pow(2, v)} MB`}
                            icon='memory'
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Done</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
