import { Chess, Move } from '@jackstenglein/chess';

const scoreRegex = /^\[(\d+)\]/;

interface TacticsProblem {
    orientation: 'white' | 'black';
    fen: string;
    solution: string;
}

export const sampleProblem: TacticsProblem = {
    orientation: 'black',
    fen: 'r5k1/pp2bppp/2p1pn2/3rN2q/5QP1/2BP4/PP2PP1P/R4RK1 b - - 0 1',
    solution: `[FEN "r5k1/pp2bppp/2p1pn2/3rN2q/5QP1/2BP4/PP2PP1P/R4RK1 b - - 0 1"]
[SetUp "1"]

1... Nxg4! { [1] } 2. Nxg4 (2. Qxg4 Rxe5 { [1] }) 2... Bd6! 3. Qf3 Rg5 { [1] } 4. h3 f5 $19 { black is winning } *`,
};

export const firstTest: TacticsProblem[] = [
    {
        orientation: 'white',
        fen: 'r1r3nk/p1q4p/4pppP/2B5/1pQ1P3/8/PPPR1PP1/2KR4 w q - 0 1',
        solution: `[FEN "r1r3nk/p1q4p/4pppP/2B5/1pQ1P3/8/PPPR1PP1/2KR4 w q - 0 1"]
[SetUp "1"]

1. Bf8! Qxc4 2. Bg7# { [1] } *`,
    },
    {
        orientation: 'white',
        fen: 'r4rk1/pp3pp1/4pq1B/2N4R/6Q1/P7/1P3PPP/n5K1 w q - 0 1',
        solution: `[FEN "r4rk1/pp3pp1/4pq1B/2N4R/6Q1/P7/1P3PPP/n5K1 w q - 0 1"]
[SetUp "1"]

1. Bxg7! { [1] } 1... Qg6 (1... Qxg7 2. Rg5 Qxg5 3. Qxg5+ Kh7 4. Nd7) 2. Bf6! { [1] The key move to see. Black is getting mated } *`,
    },
    {
        orientation: 'black',
        fen: '4k3/p2n1p2/4p3/3pP2Q/1B1P4/1P6/Pq4P1/2rR2K1 b - - 0 1',
        solution: `[FEN "4k3/p2n1p2/4p3/3pP2Q/1B1P4/1P6/Pq4P1/2rR2K1 b - - 0 1"]
[SetUp "1"]

1... Qxd4+ 2. Kh2 Qxb4 { [1] } (2... Rxd1 3. Qh8+ Nf8 4. Qxf8+ Kd7 5. Qd6+ Kc8 6. Qc6+ Kd8 7. Ba5+ Ke7 8. Qd6+ Ke8 9. Qd8#) 3. Rxc1 Qf4+ *`,
    },
    {
        orientation: 'black',
        fen: 'r2q1rk1/ppp3pp/2n2n2/8/1b1pP3/1P1P2PN/PBPN3P/R2QK2R b KQq - 0 1',
        solution: `[FEN "r2q1rk1/ppp3pp/2n2n2/8/1b1pP3/1P1P2PN/PBPN3P/R2QK2R b KQq - 0 1"]
[SetUp "1"]

1... Nd5! { [1] } 2. exd5 Qxd5 3. Nf2 Rae8+ 4. Ne4 Rxe4+ 5. dxe4 Qxe4+ { [1] } *`,
    },
    {
        orientation: 'white',
        fen: '8/8/8/5k2/8/8/2p1p1p1/2R3K1 w - - 0 1',
        solution: `[FEN "8/8/8/5k2/8/8/2p1p1p1/2R3K1 w - - 0 1"]
[SetUp "1"]

1. Kf2 { [1] } (1. Kxg2? Ke4 2. Kf2 e1=Q+! 3. Kxe1 Kd3 { Zugzwang } 4. Ra1 Kc3 5. Rc1 Kd3) 1... Ke4 2. Kxe2 Kd4 3. Rg1! { [1] } (3. Kd2 Ke4) 3... Ke4 (3... Kc3 4. Ke3 { Zugzwang }) 4. Re1! { [1] } *`,
    },
    {
        orientation: 'white',
        fen: 'r5k1/p2n1ppp/1pqP4/2p3N1/8/P3Q3/1P3PPP/4R1K1 w q - 0 1',
        solution: `[FEN "r5k1/p2n1ppp/1pqP4/2p3N1/8/P3Q3/1P3PPP/4R1K1 w q - 0 1"]
[SetUp "1"]

1. Nxf7! { [1] We gotta move in fast before the N can hop to f6. } 1... Kxf7 (1... Nf6 2. Nh6+ gxh6 3. Qe6+ Kg7 4. Qe7+ Kg6 5. Re6) 2. Qb3+! { [1] It's all about the rook coming in } 2... Kf6 (2... c4 3. Re7+ Kg8 4. Qg3 g6 5. Qc3) 3. Re7 c4 4. Qg3 *`,
    },
    {
        orientation: 'white',
        fen: '6kr/1p1Q1pp1/4p2p/n4q1P/p1r1N3/P4P2/1P4P1/1K1R3R w - - 0 1',
        solution: `[FEN "6kr/1p1Q1pp1/4p2p/n4q1P/p1r1N3/P4P2/1P4P1/1K1R3R w - - 0 1"]
[SetUp "1"]

1. Rd5!! { [1] } 1... Qxd5 2. Qe8+ Kh7 3. Nf6+ gxf6 4. Qxf7# { [1] } *`,
    },
    {
        orientation: 'white',
        fen: '1r1r2k1/pp1nbpp1/2pqbn1p/3Np3/2P5/PQ2B1PP/1P1NPPB1/2R2RK1 w - - 0 1',
        solution: `[FEN "1r1r2k1/pp1nbpp1/2pqbn1p/3Np3/2P5/PQ2B1PP/1P1NPPB1/2R2RK1 w - - 0 1"]
[SetUp "1"]

1. Nxe7+! { [1] } (1. c5? Qxd5 2. Bxd5 cxd5 $17 { black will win a third minor with d4 and be much better }) 1... Qxe7 $14 *`,
    },
    {
        orientation: 'white',
        fen: '6bk/8/5P2/p3PP2/8/8/3K4/8 w - - 0 1',
        solution: `[FEN "6bk/8/5P2/p3PP2/8/8/3K4/8 w - - 0 1"]
[SetUp "1"]

1. e6 a4 2. Kd1! { [1] } (2. Kc3 a3 3. Kb3 Bh7 4. e7 Bg8+ 5. Kxa3 Bf7 6. Kb4 Kh7 7. Kc5 Kh6 8. Kd6 Kg5 $10) (2. Kc1 a3 3. Kb1 Bh7 $10) 2... a3 3. Kc1! { [1] Zugzwang } 3... Kh7 4. Kb1 Kh6 5. Ka1! { [1] } (5. Ka2 Bh7! $10 6. f7 Kg7) 5... a2 6. Kb2 (6. Kxa2 Bh7! $10) 6... Kh7 7. Kxa2 *`,
    },
    {
        orientation: 'white',
        fen: '8/2RP2pk/7p/5p1P/5P2/6PK/3q1r2/7Q w - - 0 7',
        solution: `[FEN "8/2RP2pk/7p/5p1P/5P2/6PK/3q1r2/7Q w - - 0 7"]
[SetUp "1"]

7. d8=N! { [1] } (7. Rc8 Qe2! 8. Rh8+ Kxh8 9. d8=Q+ Kh7 10. Qh4 Kh8 $10 { despite being a queen up white can't do anything! }) (7. Rc2 Qxc2 8. d8=Q Qe2 9. Qh4 Kh8 $10 { same as Rc8 }) (7. d8=Q Rh2+! 8. Qxh2 Qxh2+ 9. Kxh2 $10) 7... Qe2 (7... Qxd8 8. Qc6! { [1] } 8... Qf8 9. Qg6+ Kh8 10. Rf7 Qg8 11. Re7 $18) 8. Rxg7+! { [1] } 8... Kxg7 (8... Kh8 9. Rh7+ Kg8 10. Qd5+ $18) 9. Qb7+ Kh8 (9... Kg8 10. Qf7+ Kh8 11. Qf6+ Kg8 12. Qg6+ Kh8 13. Nf7#) 10. Nf7+! { [1] } 10... Kg8 11. Nxh6+ Kh8 12. Qc8+ Kg7 13. Qg8+ Kxh6 14. Qg6# *`,
    },
];

export function getMoveDescription(found?: boolean, score?: number): string {
    if (found) {
        if (score) {
            return `Great job finding this move! You earned ${score} point${score !== 1 ? 's' : ''}.`;
        }
        return `You found this move, but it's worth 0 points.`;
    }

    if (score) {
        return `You didn't find this move and lost ${score} point${score !== 1 ? 's' : ''}.`;
    }
    return `You didn't find this move, but it's worth 0 points.`;
}

export function getSolutionScore(solution: Move[]): number {
    let score = 0;

    for (let move of solution) {
        // Recursively check variations
        if (move.variations.length > 0) {
            for (let variation of move.variations) {
                score += getSolutionScore(variation);
            }
        }

        const scoreSearch = scoreRegex.exec(move.commentAfter || '');
        if (scoreSearch && scoreSearch.length > 1) {
            move.userData = {
                score: parseInt(scoreSearch[1]),
            };
            move.commentAfter = move.commentAfter?.replace(scoreSearch[0], '');
        } else {
            move.userData = { score: 0 };
        }

        score += move.userData.score;
    }

    return score;
}

export function scoreVariation(
    solution: Move[],
    currentAnswerMove: Move | null,
    answer: Chess,
): number {
    let score = 0;

    for (let move of solution) {
        // The user may not have found the mainline solution,
        // but may have found a variation, which can also have a score associated
        if (move.variations.length > 0) {
            for (let variation of move.variations) {
                score += scoreVariation(variation, currentAnswerMove, answer);
            }
        }

        // Check if the user found this move and save it in the userData if so.
        // If the user didn't find the move, then they couldn't have found the
        // continuations, so we can break from the loop
        const answerMove = answer.move(move.san, currentAnswerMove, false, true, true);
        if (!answerMove) {
            break;
        }

        move.userData = {
            ...move.userData,
            found: true,
        };
        score += move.userData.score || 0;
        currentAnswerMove = answerMove;
    }

    return score;
}

export function addExtraVariation(
    answer: Move[],
    currentSolutionMove: Move | null,
    solution: Chess,
) {
    for (let move of answer) {
        if (move.variations.length > 0) {
            for (let variation of move.variations) {
                addExtraVariation(variation, currentSolutionMove, solution);
            }
        }

        let existingMove = solution.move(
            move.san,
            currentSolutionMove,
            false,
            true,
            true,
        );
        if (!existingMove) {
            existingMove = solution.move(
                move.san,
                currentSolutionMove,
                false,
                false,
                true,
            )!;
            existingMove.userData = {
                extra: true,
            };
        }
        currentSolutionMove = existingMove;
    }
}
