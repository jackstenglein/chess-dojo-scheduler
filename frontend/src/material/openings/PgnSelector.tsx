import { Header } from '@jackstenglein/chess';
import {
    Card,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    Stack,
    Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function getPgnName(header: Header): string {
    if (header.tags.PgnName) {
        return header.tags.PgnName;
    }

    return `${header.tags.White} - ${header.tags.Black}`;
}

interface PgnSelectorProps {
    pgns: string[];
    selectedIndex: number;
    setSelectedIndex: (i: number) => void;
    completed?: boolean[];
}

const PgnSelector: React.FC<PgnSelectorProps> = ({
    pgns,
    selectedIndex,
    setSelectedIndex,
    completed,
}) => {
    const headers = pgns.map((pgn) => new Header(pgn));

    return (
        <Card
            sx={{
                gridArea: 'extras',
                maxWidth: 1,
                maxHeight: '18em',
                overflowY: 'scroll',
            }}
        >
            <List>
                {headers.map((header, idx) => (
                    <ListItem key={idx} disablePadding>
                        <ListItemButton
                            sx={{ pl: 0 }}
                            selected={selectedIndex === idx}
                            onClick={() => setSelectedIndex(idx)}
                        >
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Stack alignItems='center' width={1}>
                                    <Typography
                                        sx={{
                                            color: 'primary.main',
                                        }}
                                    >
                                        {idx + 1}
                                    </Typography>
                                </Stack>
                            </ListItemIcon>
                            <Stack
                                direction='row'
                                justifyContent='space-between'
                                width={1}
                                spacing={1}
                            >
                                <Typography key={idx} variant='body2'>
                                    {getPgnName(header)}
                                </Typography>

                                {completed !== undefined ? (
                                    completed[idx] && <CheckCircleIcon color='success' />
                                ) : (
                                    <Typography variant='caption'>
                                        {header.tags.Result}
                                    </Typography>
                                )}
                            </Stack>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Card>
    );
};

export default PgnSelector;
