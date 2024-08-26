import { Grid } from '@mui/material';
import Position from '../../requirements/Position';

import { ModuleProps } from './Module';

const SparringPositionsModule: React.FC<ModuleProps> = ({ module }) => {
    if (!module.positions) {
        return null;
    }

    return (
        <Grid container spacing={2} mt={0.5}>
            {module.positions.map((p) => (
                <Grid key={p.fen} item md='auto'>
                    <Position position={p} orientation={module.boardOrientation} />
                </Grid>
            ))}
        </Grid>
    );
};

export default SparringPositionsModule;
