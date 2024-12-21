import Position from '@/requirements/Position';
import { Grid2 } from '@mui/material';

import { ModuleProps } from './Module';

const SparringPositionsModule: React.FC<ModuleProps> = ({ module }) => {
    if (!module.positions) {
        return null;
    }

    return (
        <Grid2 container spacing={2} mt={0.5}>
            {module.positions.map((p) => (
                <Grid2 key={p.fen} size={{ md: 'auto' }}>
                    <Position position={p} orientation={module.boardOrientation} />
                </Grid2>
            ))}
        </Grid2>
    );
};

export default SparringPositionsModule;
