import { useState } from 'react';
import { Move } from '@jackstenglein/chess';
import { Stack, Paper, Card, useMediaQuery } from '@mui/material';

import { Game } from '../../database/game';
import { useChess } from './PgnBoard';
import { Color } from 'chessground/types';
import Tags from './Tags';
import Editor from './Editor';
import { useLightMode } from '../../ThemeProvider';
import Explorer from './explorer/Explorer';
import StartButtons from './boardButtons/StartButtons';
import ControlButtons from './boardButtons/ControlButtons';
import EndButtons from './boardButtons/EndButtons';

interface BoardToolsProps {
    startOrientation?: Color;

    onClickMove: (move: Move | null) => void;

    showSave?: boolean;
    showDelete?: boolean;
    game?: Game;

    showTags?: boolean;
    showEditor?: boolean;
    showExplorer?: boolean;
}

const BoardTools: React.FC<BoardToolsProps> = ({
    onClickMove,

    showSave,
    showDelete,
    game,

    showTags,
    showEditor,
    showExplorer,
}) => {
    const { chess } = useChess();
    const [underboard, setUnderboard] = useState(
        showEditor ? 'editor' : showTags ? 'tags' : showExplorer ? 'explorer' : ''
    );
    const light = useLightMode();
    const isMedium = useMediaQuery((theme: any) => theme.breakpoints.up('md'));

    return (
        <>
            <Paper
                elevation={3}
                variant={light ? 'outlined' : 'elevation'}
                sx={{
                    mt: { xs: 0.5, md: 1 },
                    mb: { xs: 0.5, md: 1 },
                    gridArea: 'boardButtons',
                    boxShadow: 'none',
                }}
            >
                <Stack
                    direction='row'
                    justifyContent={isMedium ? 'space-between' : 'space-around'}
                    flexWrap='wrap'
                >
                    {isMedium && (
                        <StartButtons
                            showSave={showSave}
                            showDelete={showDelete}
                            game={game}
                        />
                    )}

                    <ControlButtons onClickMove={onClickMove} small={!isMedium} />

                    {isMedium && (
                        <EndButtons
                            underboard={underboard}
                            setUnderboard={setUnderboard}
                            showTags={showTags}
                            showEditor={showEditor}
                            showExplorer={showExplorer}
                        />
                    )}
                </Stack>
            </Paper>

            {!isMedium && (
                <Paper
                    elevation={3}
                    variant={light ? 'outlined' : 'elevation'}
                    sx={{ mt: 1, gridArea: 'extraButtons', boxShadow: 'none' }}
                >
                    <Stack direction='row' justifyContent='space-between' flexWrap='wrap'>
                        <StartButtons
                            showSave={showSave}
                            showDelete={showDelete}
                            game={game}
                        />

                        <EndButtons
                            underboard={underboard}
                            setUnderboard={setUnderboard}
                            showTags={showTags}
                            showEditor={showEditor}
                            showExplorer={showExplorer}
                        />
                    </Stack>
                </Paper>
            )}

            {underboard && (
                <Card
                    elevation={3}
                    sx={{
                        gridArea: 'underboard',
                        overflowY: 'scroll',
                        boxShadow: 'none',
                        maxHeight: { xs: '22em', xl: 1 },
                        mt: { xs: 1, xl: 0 },
                    }}
                    variant={light ? 'outlined' : 'elevation'}
                >
                    {underboard === 'tags' && (
                        <Tags
                            tags={chess?.pgn.header.tags}
                            game={game}
                            allowEdits={showEditor}
                        />
                    )}
                    {underboard === 'editor' && <Editor />}
                    {underboard === 'explorer' && <Explorer />}
                </Card>
            )}
        </>
    );
};

export default BoardTools;
