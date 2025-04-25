import { expose, proxy } from 'comlink';
import { loadChesscom } from './ChesscomLoader';
import { loadLichess } from './LichessLoader';
import { OpeningTree } from './OpeningTree';
import { PlayerSource, SourceType } from './PlayerSource';

export interface OpeningTreeLoaderFactory {
    newLoader: () => OpeningTreeLoader;
}

export class OpeningTreeLoader {
    private openingTree: OpeningTree | undefined;

    async load(sources: PlayerSource[], incrementIndexedCount: (inc?: number) => void) {
        const chesscomSources: PlayerSource[] = [];
        const lichessSources: PlayerSource[] = [];

        for (const source of sources) {
            if (source.type === SourceType.Chesscom) {
                chesscomSources.push(source);
            } else {
                lichessSources.push(source);
            }
        }

        const promises = [
            loadChesscom(chesscomSources, incrementIndexedCount),
            loadLichess(lichessSources, incrementIndexedCount),
        ];
        const [chesscomTree, lichessTree] = await Promise.all(promises);
        console.log('Chesscom Tree: ', chesscomTree);
        console.log('Lichess Tree: ', lichessTree);

        this.openingTree = chesscomTree;
        this.openingTree.mergeTree(lichessTree);

        console.log('Merged tree: ', this.openingTree);
        return this.openingTree;
    }
}

// const loader: OpeningTreeLoader = {
//     load,
// };

expose({
    newLoader: () => proxy(new OpeningTreeLoader()),
});
