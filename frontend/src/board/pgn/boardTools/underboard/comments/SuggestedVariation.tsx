import Lines from '@/board/pgn/pgnText/Lines';
import { Chess } from '@jackstenglein/chess';

export function SuggestedVariation({ pgn }: { pgn: string }) {
    const variationChess = new Chess({ pgn });
    return <Lines lines={[variationChess.history()]} handleScroll={() => null} />;
}
