import { expose, proxy } from 'comlink';
import { loadChesscom } from './ChesscomLoader';
import { OpeningTree } from './OpeningTree';
import { PlayerSource, SourceType } from './PlayerSource';

export interface OpeningTreeLoaderFactory {
    newLoader: () => OpeningTreeLoader;
}

export class OpeningTreeLoader {
    private openingTree: OpeningTree | undefined;

    async load(sources: PlayerSource[], incrementIndexedCount: (inc?: number) => void) {
        try {
            throw Error('Throwing for breakpoint');
        } catch {
            console.error('Caught breakpoint exception');
        }

        const chesscomSources: PlayerSource[] = [];
        const lichessSources: PlayerSource[] = [];

        for (const source of sources) {
            if (source.type === SourceType.Chesscom) {
                chesscomSources.push(source);
            } else {
                lichessSources.push(source);
            }
        }

        this.openingTree = await loadChesscom(chesscomSources, incrementIndexedCount);
        console.log('Final opening tree: ', this.openingTree);
        return this.openingTree;
    }
}

// const loader: OpeningTreeLoader = {
//     load,
// };

expose({
    newLoader: () => proxy(new OpeningTreeLoader()),
});
