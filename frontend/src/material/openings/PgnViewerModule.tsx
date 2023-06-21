import { useLayoutEffect, useState } from 'react';
import { Button, Grid, Stack, Typography } from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckIcon from '@mui/icons-material/Check';
import { pgnEdit } from '@mliebelt/pgn-viewer';

import { ModuleProps } from './Module';
import { useAuth } from '../../auth/Auth';
import CopyToClipboard from 'react-copy-to-clipboard';

const boardId = 'board';

const PgnViewerModule: React.FC<ModuleProps> = ({ module }) => {
    const user = useAuth().user!;
    const [copied, setCopied] = useState('');

    useLayoutEffect(() => {
        if (module.pgn) {
            pgnEdit(boardId, {
                pgn: module.pgn,
                pieceStyle: 'alpha',
                theme: 'blue',
                showResult: false,
                notationLayout: 'list',
                resizable: false,
            });
        }
    });

    if (!module.pgn) {
        return null;
    }

    const onCopy = (name: string) => {
        setCopied(name);
        setTimeout(() => {
            setCopied('');
        }, 3000);
    };

    return (
        <Stack>
            <Typography variant='h6'>{module.name}</Typography>
            <Typography>{module.description}</Typography>

            <Grid container mt={1} rowGap={2}>
                <Grid item sm={12} md={9}>
                    <div
                        id={boardId}
                        className={
                            user.enableDarkMode
                                ? 'reactBoard opening dark'
                                : 'reactBoard opening'
                        }
                    ></div>
                </Grid>
                <Grid item xs={12} mt={3}>
                    <CopyToClipboard text={module.pgn} onCopy={() => onCopy('pgn')}>
                        <Button
                            variant='contained'
                            startIcon={
                                copied === 'pgn' ? <CheckIcon /> : <ContentPasteIcon />
                            }
                        >
                            {copied === 'pgn' ? 'Copied' : 'Copy PGN'}
                        </Button>
                    </CopyToClipboard>
                </Grid>
            </Grid>
        </Stack>
    );
};

export default PgnViewerModule;
