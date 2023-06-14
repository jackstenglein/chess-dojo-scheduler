import { Grid, Stack, Typography } from '@mui/material';
import Position from '../../requirements/Position';

import { ModuleProps } from './Module';

const SparringPositionsModule: React.FC<ModuleProps> = ({ module }) => {
    if (!module.positions) {
        return null;
    }

    return (
        <Stack>
            <Typography variant='h6'>{module.name}</Typography>
            <Typography>{module.description}</Typography>

            <Grid container spacing={2} mt={0.5}>
                {module.positions.map((p) => (
                    <Grid key={p.fen} item xs='auto'>
                        <Position position={p} />
                    </Grid>
                ))}
            </Grid>
        </Stack>
    );
};

export default SparringPositionsModule;
