import { expose } from 'comlink';
import { PlayerSource, SourceType } from './PlayerSource';

export interface OpeningTreeLoader {
    load: (sources: PlayerSource[]) => void;
}

function load(sources: PlayerSource[]) {
    console.error('Opening Tree Loader sources: ', sources);
    console.log('First player source is chesscom: ', sources[0]?.type === SourceType.Chesscom);
}

const loader: OpeningTreeLoader = {
    load,
};

expose(loader);
