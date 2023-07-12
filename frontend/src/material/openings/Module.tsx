import { Stack, Typography } from '@mui/material';

import { OpeningModule, OpeningModuleType } from '../../database/opening';
import ExercisesModule from './ExercisesModule';
import ModelGamesModule from './ModelGamesModule';
import PgnViewerModule from './PgnViewerModule';
import SparringPositionsModule from './SparringPositionsModule';
import VideoModule from './VideoModule';

export interface ModuleProps {
    module: OpeningModule;
}

const Module: React.FC<ModuleProps> = ({ module }) => {
    let M = null;
    switch (module.type) {
        case OpeningModuleType.Video:
            M = <VideoModule module={module} />;
            break;
        case OpeningModuleType.PgnViewer:
            M = <PgnViewerModule module={module} />;
            break;
        case OpeningModuleType.SparringPositions:
            M = <SparringPositionsModule module={module} />;
            break;
        case OpeningModuleType.ModelGames:
            M = <ModelGamesModule module={module} />;
            break;
        case OpeningModuleType.Themes:
            M = null;
            break;
        case OpeningModuleType.Exercises:
            M = <ExercisesModule module={module} />;
            break;
        default:
            M = null;
    }

    if (M === null) {
        return null;
    }

    return (
        <Stack>
            <Typography variant='h6'>{module.name}</Typography>
            <Typography>{module.description}</Typography>

            {M}

            {module.postscript && <Typography>{module.postscript}</Typography>}
        </Stack>
    );
};

export default Module;
