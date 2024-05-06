'use strict';

import { assert, test } from 'vitest';
import { getGame, isFairyChess } from './create';
import { GameOrientation } from './types';

test('isFairyChess does not trigger on standard chess', () => {
    const pgnText =
        '[BlackRatingDiff "+53"]\n[Variant "Standard"]\n[TimeControl "900+15"]';

    assert.isFalse(isFairyChess(pgnText));
});

test('isFairyChess triggers on variants', () => {
    const pgnText =
        '[Black "sammynouri"]\n[Variant "Chess960"]\n[SetUp "1"]\n[FEN "rknbrnbq/pppppppp/8/8/8/8/PPPPPPPP/RKNBRNBQ w - - 0 1"]';

    assert.isTrue(isFairyChess(pgnText));
});

test('getGame defaults gracefully', () => {
    const pgnText = '';
    const reqHeaders = undefined;
    const orientation = GameOrientation.White;
    const user = undefined;

    const [game] = getGame(user, pgnText, reqHeaders, orientation);

    assert.isNotNull(game, 'empty PGN should be supported');
    assert.isTrue(game?.unlisted);
});

test('getGame supports chess.com saved annotation default Date', () => {
    const reqHeaders = undefined;
    const orientation = GameOrientation.White;
    const user = undefined;

    const pgnText = `
[Event "?"]
[Site "?"]
[Date "????.??.??"]
[Round "?"]
[White "?"]
[Black "?"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. c3 Nf6 4. d4 Nxe4 5. d5 Ne7 6. Nxe5 d6 7. Bb5+ c6 8. dxc6
Qb6 {here Black threatens Qxf2 check mate!} 9. cxb7+ Kd8 10. Nxf7+ Kc7 {now if
White plays bxa8+Q he loses to the Qxf2 check mate.} 11. bxa8=N+ Kb7 12. Nxb6
{1-0 Black resigned} *`;

    getGame(user, pgnText, reqHeaders, orientation);
});

test('getGame handles incomplete pgn', () => {
    const reqHeaders = undefined;
    const orientation = GameOrientation.White;
    const user = undefined;

    const pgnText = `
[Event "Quick Tips to Improve Your Chess: Part 1: Don't Block Your Central Pawns!"]
[Site "https://lichess.org/study/y14Z6s3N/fqJZzUm8"]
[Result "*"]
[Variant "Standard"]
[ECO "?"]
[Opening "?"]
[Annotator "https://lichess.org/@/Kyle-and-Jess"]
[FEN "r1bqkb1r/2pp1ppp/p1n2n2/1p2p3/4P3/P1NB1N1P/1PPP1PP1/R1BQK2R b KQkq - 1 1"]
[SetUp "1"]
[UTCDate "2024.04.20"]
[UTCTime "01:12:07"]
[Source "https://lichess.org/study/y14Z6s3N/fqJZzUm8"]

{ White has just played Bd3, putting their bishop in front of their d-pawn. This is a very common error seen at lower levels and most of the time, this move doesn't flat out lose right away. But the reason that you should avoid this is that now white's dark-squared bishop will have a difficult time developing with the d-pawn blocked. Also, your light-squared bishop should have a future that's brighter than being a tall pawn. } { [%csl Gd3][%cal Gf1d3,Rc1d2,Rc1b2] }
 *


`;
    const [game] = getGame(user, pgnText, reqHeaders, orientation);

    const pgn = game.pgn.trim();
    assert.equal(pgn[pgn.length - 1], '*');
});
