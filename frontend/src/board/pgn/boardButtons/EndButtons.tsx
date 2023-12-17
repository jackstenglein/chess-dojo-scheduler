import { Stack, Tooltip, IconButton } from '@mui/material';
import SellIcon from '@mui/icons-material/Sell';
import EditIcon from '@mui/icons-material/Edit';
import ExplorerIcon from '@mui/icons-material/Storage';

interface EndButtonsProps {
    underboard: string;
    setUnderboard: (v: string) => void;
    showTags?: boolean;
    showEditor?: boolean;
    showExplorer?: boolean;
}

const EndButtons: React.FC<EndButtonsProps> = ({
    underboard,
    setUnderboard,
    showTags,
    showEditor,
    showExplorer,
}) => {
    return (
        <Stack direction='row'>
            {showTags && (
                <Tooltip title='PGN Tags'>
                    <IconButton
                        aria-label='pgn-tags'
                        sx={{
                            color: underboard === 'tags' ? 'info.main' : 'text.secondary',
                        }}
                        onClick={() => setUnderboard(underboard === 'tags' ? '' : 'tags')}
                    >
                        <SellIcon />
                    </IconButton>
                </Tooltip>
            )}

            {showEditor && (
                <Tooltip title='Edit PGN'>
                    <IconButton
                        aria-label='edit-pgn'
                        sx={{
                            color:
                                underboard === 'editor' ? 'info.main' : 'text.secondary',
                        }}
                        onClick={() =>
                            setUnderboard(underboard === 'editor' ? '' : 'editor')
                        }
                    >
                        <EditIcon />
                    </IconButton>
                </Tooltip>
            )}

            {showExplorer && (
                <Tooltip title='Position Database'>
                    <IconButton
                        sx={{
                            color:
                                underboard === 'explorer'
                                    ? 'info.main'
                                    : 'text.secondary',
                        }}
                        onClick={() =>
                            setUnderboard(underboard === 'explorer' ? '' : 'explorer')
                        }
                    >
                        <ExplorerIcon />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
    );
};

export default EndButtons;
