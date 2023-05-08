export interface Position {
    title: string;
    fen: string;
    link: string;
    limitSeconds: number;
    incrementSeconds: number;
}

export interface CohortPositions {
    cohort: string;
    positions: Position[];
}

export interface PositionSection {
    title: string;
    cohorts: CohortPositions[];
}

export const sections: PositionSection[] = [
    {
        title: 'Middlegame Win Conversions',
        cohorts: [
            {
                cohort: '600-1000',
                positions: [
                    {
                        title: '#1: Extra Queen',
                        fen: '2r2rk1/pb1nbppp/1p2pn2/2pp4/3P1B2/2PBPN2/PP3PPP/RN1QR1K1 w - - 0 1',
                        link: '//www.chess.com/emboard?id=10522617',
                        limitSeconds: 300,
                        incrementSeconds: 5,
                    },
                    {
                        title: '#2: Extra Rook',
                        fen: 'r2qk2B/pbp1bp1p/1p2pn2/3p4/8/1P1P1N2/P1P1BPPP/RN1Q1RK1 w q - 0 1',
                        link: '//www.chess.com/emboard?id=10522621',
                        limitSeconds: 300,
                        incrementSeconds: 5,
                    },
                    {
                        title: '#3: Two Extra Pieces',
                        fen: 'r2qk2r/pbp2ppp/1p2pn2/3pN3/3Q4/8/PPP1BPPP/RNB2RK1 w kq - 0 1',
                        link: '//www.chess.com/emboard?id=10522627',
                        limitSeconds: 300,
                        incrementSeconds: 5,
                    },
                    {
                        title: '#4: One Extra Piece',
                        fen: '3q1rk1/p1pn1ppp/1p1b1n2/6N1/8/2N2Q2/PPP2PPP/R1B1R1K1 w - - 0 1',
                        link: '//www.chess.com/emboard?id=10522633',
                        limitSeconds: 300,
                        incrementSeconds: 5,
                    },
                ],
            },
        ],
    },
    {
        title: 'Middlegame Sparring',
        cohorts: [
            {
                cohort: '1000-1100',
                positions: [
                    {
                        title: '#1: Alekhine - NN',
                        fen: 'r1bqnrk1/ppppnppp/1b6/3PP3/2B5/5N2/PP3PPP/RNBQ1RK1 w - - 0 10',
                        link: '//www.chess.com/emboard?id=10526059',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                ],
            },
            {
                cohort: '1100-1200',
                positions: [
                    {
                        title: '#1: Marshall - Chigorin',
                        fen: '2rqr1k1/pp3ppp/5nn1/8/2NP4/P2Q4/1B3PPP/R4RK1 w - - 0 19',
                        link: '//www.chess.com/emboard?id=10526067',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                ],
            },
            {
                cohort: '1200-1300',
                positions: [
                    {
                        title: '#1: Steinitz - Paulsen',
                        fen: '2kr1bnr/ppp2ppp/2np4/8/3PPB1q/P1N1K3/1PP1B1PP/R2Q3R w - - 0 13',
                        link: '//www.chess.com/emboard?id=10526073',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                ],
            },
            {
                cohort: '1300-1400',
                positions: [
                    {
                        title: '#1: Kline - Capablanca',
                        fen: 'r1b1rnk1/pp3ppp/2p2q2/4p2n/4P3/2PBNN2/PPQ2PPP/R4RK1 w - - 0 16',
                        link: '//www.chess.com/emboard?id=10526101',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                ],
            },
            {
                cohort: '1400-1500',
                positions: [
                    {
                        title: '#1: Stein - Furman',
                        fen: 'rn1k1b1r/1bq2ppp/p2p1n2/3P4/Pp1N4/6P1/1PP2PBP/R1BQR1K1 w - - 0 13',
                        link: '//www.chess.com/emboard?id=10526109',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                    {
                        title: '#2: Rosenthal - Steinitz',
                        fen: 'r1br2k1/ppp2pbp/6p1/8/2qN1P2/2P1B3/PPQ3PP/R4RK1 w - - 0 16',
                        link: '//www.chess.com/emboard?id=10526115',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                ],
            },
            {
                cohort: '1500-1600',
                positions: [
                    {
                        title: '#1: Knorre - Chigorin',
                        fen: 'r1bqk2r/ppp2N2/2np1n2/2b1p3/2B1P3/3P2p1/PPP2PPP/RN1Q1RK1 w kq - 0 11',
                        link: '//www.chess.com/emboard?id=10526123',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                    {
                        title: '#2: Gunsberg - Chigorin',
                        fen: 'r4rk1/2p2pbp/p1nqbnp1/1p2p3/3pP1P1/2PP1N1P/PPBNQP2/R1B1K2R w KQ - 0 14',
                        link: '//www.chess.com/emboard?id=10526125',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                ],
            },
            {
                cohort: '1600-1700',
                positions: [
                    {
                        title: '#1: Keres - Sajtar',
                        fen: 'r1b1kb1r/1p1n2pp/p2pNn2/6B1/2q1P3/2N5/PPP2PPP/R2Q1RK1 w kq - 0 11',
                        link: '//www.chess.com/emboard?id=10526129',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                    {
                        title: '#2: Lasker - Steinitz',
                        fen: 'r1b2rk1/6pp/1qpp1p1n/pp2p3/4P3/1P1PPNNP/1PPQ2P1/4RRK1 w - - 0 18',
                        link: '//www.chess.com/emboard?id=10526131',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                ],
            },
            {
                cohort: '1700-1800',
                positions: [
                    {
                        title: '#1: Nimzowitsch - Capablanca',
                        fen: '2r1r1k1/2pq1pbp/Q1pp1np1/8/4P3/2N5/PPP2PPP/R1B2RK1 w - - 0 15',
                        link: '//www.chess.com/emboard?id=10526143',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                    {
                        title: '#2: Romanishin - Petrosian',
                        fen: '1q2rrk1/1b2bp1p/pp1p1np1/3P4/2PQ1P2/1P3R2/PBB3PP/2R4K w - - 0 19',
                        link: '//www.chess.com/emboard?id=10526153',
                        limitSeconds: 900,
                        incrementSeconds: 10,
                    },
                ],
            },
            {
                cohort: '1800-1900',
                positions: [
                    {
                        title: '#1: Bondarevsky - Lilienthal',
                        fen: 'r1br2k1/pp2qppp/3pnn2/2p1p3/3PP3/2P2N2/P1P2PPP/R1BQRBK1 w - - 0 13',
                        link: '//www.chess.com/emboard?id=10526163',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#2: Lipnitsky - Kotlerman',
                        fen: '1rbq1rk1/3nbppp/p1p1p3/3p2PP/4PP2/2N1B3/PPPQB3/2KR3R w - - 0 16',
                        link: '//www.chess.com/emboard?id=10526169',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#3: Petrosian - Smyslov',
                        fen: '2rr2k1/1bqnbppp/p2p1n2/1p2pP2/4P3/P1N1BB2/1PPN2PP/R2Q1R1K w - - 0 16',
                        link: '//www.chess.com/emboard?id=10526171',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                ],
            },
            {
                cohort: '1900-2000',
                positions: [
                    {
                        title: '#1: Koenig - Smyslov',
                        fen: 'r1b2rk1/5ppp/pnqp1b2/np2p3/4P3/2P2N1P/PPB2PP1/R1BQRNK1 w - - 0 16',
                        link: '//www.chess.com/emboard?id=10526173',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#2: Fischer - Myagmarsuren',
                        fen: 'r2q1rk1/3nbppp/b3p3/n1ppP3/p4B1P/P2PNNP1/2P2PB1/R2QR1K1 w - - 0 16',
                        link: '//www.chess.com/emboard?id=10526179',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#3: Fischer - Larsen',
                        fen: '5rk1/p1r1ppbp/3p1np1/q7/1p1BP3/1B3P2/PPPQ2PP/1K1R3R w - - 0 17',
                        link: '//www.chess.com/emboard?id=10526183',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                ],
            },
            {
                cohort: '2000-2100',
                positions: [
                    {
                        title: '#1: Saemisch - Alekhine',
                        fen: 'r2r2k1/pb3pp1/3ppq1p/2p5/2P5/3BP3/PPQ2PPP/3R1RK1 w - - 0 17',
                        link: '//www.chess.com/emboard?id=10526189',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#2: Thomas - Alekhine',
                        fen: 'r4rk1/pq2ppbp/1p4p1/8/3p1P2/3P4/PPP3PP/R1B1QR1K w - - 0 18',
                        link: '//www.chess.com/emboard?id=10526193',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#3: Alekhine - Yates',
                        fen: 'r2qr1k1/pb1nbppp/1p3n2/3p2B1/3N3P/2NBP3/PPQ2PP1/2KR3R w - - 0 13',
                        link: '//www.chess.com/emboard?id=10526197',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                ],
            },
            {
                cohort: '2100-2200',
                positions: [
                    {
                        title: '#1: Pilnik - Geller',
                        fen: 'r2r2k1/pb3pp1/3ppq1p/2p5/2P5/3BP3/PPQ2PPP/3R1RK1 w - - 0 17',
                        link: '//www.chess.com/emboard?id=10526199',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#2: Smyslov - Reshevksy',
                        fen: 'r3r1k1/1pp1qpp1/p1n3np/3Rp3/4P3/1BP2Q2/PP3PPP/R1B3K1 w - - 0 18',
                        link: '//www.chess.com/emboard?id=10526207',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#3: Taimanov - Averbakh',
                        fen: '3q1rk1/pbr2ppp/1p2pn2/2p1N3/2PPn3/P2BP3/1B3PPP/R2QR1K1 w - - 0 16',
                        link: '//www.chess.com/emboard?id=10526213',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                ],
            },
            {
                cohort: '2200-2300',
                positions: [
                    {
                        title: '#1: Alatortsev - Levenfish',
                        fen: 'r1b2rk1/p1p1q1pp/1p1p4/3Pn3/2P1Pp2/3N1P2/PP4BP/2RQR1K1 w - - 0 19',
                        link: '//www.chess.com/emboard?id=10526215',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#2: Alekhine - Lasker',
                        fen: 'r1bqrnk1/pp3ppp/2pb4/3p4/3P1P2/2NB1NP1/PPQ2P1P/R4RK1 w - - 0 13',
                        link: '//www.chess.com/emboard?id=10526219',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#3: Smyslov - Keres',
                        fen: 'rqrb2k1/n2b1p1p/p2p1np1/1p1Pp3/1P2P2N/1N1B1Q1P/P2B1PP1/R3R1K1 w - - 0 23',
                        link: '//www.chess.com/emboard?id=10526223',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#4: Tal - Tolush',
                        fen: 'r1b1r1k1/1p1n1pbp/p2p1np1/q1pPp1B1/2P1P1PP/2N2PN1/PP1Q4/R3KB1R w KQ - 0 13',
                        link: '//www.chess.com/emboard?id=10526231',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                ],
            },
            {
                cohort: '2300-2400',
                positions: [
                    {
                        title: '#1: Smyslov - Reshevsky',
                        fen: '3rr1k1/2q2pp1/1p1p1np1/p1n1p3/2P5/1P2QPPB/PB1RP2P/3R2K1 w - - 0 21',
                        link: '//www.chess.com/emboard?id=10526235',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#2: Petrosian - Smyslov',
                        fen: 'r2qk2r/pb2bp2/1n2p1p1/1p2P1Np/2pP3P/2P3Q1/4BPP1/R1B1K2R w KQkq - 0 16',
                        link: '//www.chess.com/emboard?id=10526241',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#3: Karpov - Spassky',
                        fen: 'r4rk1/2b2pp1/p1p3qp/PpN5/1PnPN3/6Pb/4BP1P/2RQR1K1 w - - 0 24',
                        link: '//www.chess.com/emboard?id=10526247',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#4: Spassky - Fischer',
                        fen: 'r1b1qrk1/1pp1ppbp/1n4p1/p3P3/4N3/5N1P/1PP1QPP1/R1B1R1K1 w - - 0 16',
                        link: '//www.chess.com/emboard?id=10526255',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                ],
            },
            {
                cohort: '2400+',
                positions: [
                    {
                        title: '#1: Spassky - Petrosian',
                        fen: '3rr1k1/2q2pp1/1p1p1np1/p1n1p3/2P5/1P2QPPB/PB1RP2P/3R2K1 w - - 0 21',
                        link: '//www.chess.com/emboard?id=10526261',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#2: Capablanca - Fine',
                        fen: 'r1q2rk1/pp1b1ppp/5b2/3Q4/8/2N1PN2/PP3PPP/R3K2R w KQ - 0 13',
                        link: '//www.chess.com/emboard?id=10526263',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#3: Kasparov - Grischuk',
                        fen: 'r2q1rk1/3bbppp/pn1p1n2/2pPp3/PpP1P3/1P3N1P/2B1QPP1/RNB1R1K1 w - - 0 17',
                        link: '//www.chess.com/emboard?id=10526267',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                    {
                        title: '#4: McShane - Carlsen',
                        fen: 'r1bqr1k1/1pp1b1pp/p3np2/2p1p3/4P2N/1P1P4/PBP1NPPP/R2Q1R1K w - - 0 14',
                        link: '//www.chess.com/emboard?id=10526281',
                        limitSeconds: 900,
                        incrementSeconds: 30,
                    },
                ],
            },
        ],
    },
];
