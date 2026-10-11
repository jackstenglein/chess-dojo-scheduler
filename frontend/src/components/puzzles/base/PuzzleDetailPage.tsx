'use client';

import PgnBoard from '@/board/pgn/PgnBoard';
import {
    PuzzlebasePuzzle,
    PuzzlebaseTaxonomy,
} from '@jackstenglein/chess-dojo-common/src/puzzlebase/api';
import { ArrowBack } from '@mui/icons-material';
import { Alert, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PUZZLE_COORDINATE_SIZE } from '../settings/puzzleSettingsKeys';
import { PuzzlebaseClient } from './puzzlebaseClient';
import { errorMessage, errorStatus } from './puzzlebaseErrors';
import { PuzzlebaseGate } from './PuzzlebaseGate';
import { PuzzleInfoPanel } from './PuzzleInfoPanel';

/**
 * A single puzzle: the details and the solution, stepped through on a board. No solving. Like the
 * rest of the puzzlebase, it is only for Puzzle Contributors and admins.
 */
export function PuzzleDetailPage({ id }: { id: string }) {
    return (
        <PuzzlebaseGate>{({ client }) => <PuzzleDetail client={client} id={id} />}</PuzzlebaseGate>
    );
}

function PuzzleDetail({ client, id }: { client: PuzzlebaseClient; id: string }) {
    const [loaded, setLoaded] = useState<{
        puzzle: PuzzlebasePuzzle;
        taxonomy: PuzzlebaseTaxonomy;
    }>();
    const [error, setError] = useState<{ notFound: boolean; message: string }>();

    useEffect(() => {
        let cancelled = false;
        Promise.all([client.getPuzzle(id), client.getTaxonomy()])
            .then(([puzzle, taxonomy]) => {
                if (!cancelled) setLoaded({ puzzle, taxonomy });
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError({ notFound: errorStatus(err) === 404, message: errorMessage(err) });
                }
            });
        return () => {
            cancelled = true;
        };
    }, [client, id]);

    if (error) {
        return (
            <Container sx={{ py: 6 }}>
                <Stack sx={{ gap: 2, alignItems: 'flex-start' }}>
                    {error.notFound ? (
                        <Typography variant='h5'>Puzzle not found</Typography>
                    ) : (
                        <Alert severity='error'>{error.message}</Alert>
                    )}
                    <Button component={Link} href='/puzzles/base' startIcon={<ArrowBack />}>
                        Back to the PuzzleBase
                    </Button>
                </Stack>
            </Container>
        );
    }

    if (!loaded) {
        return (
            <Stack sx={{ alignItems: 'center', py: 12 }} role='status' aria-label='Loading puzzle'>
                <CircularProgress />
            </Stack>
        );
    }

    const { puzzle, taxonomy } = loaded;

    const orientation = puzzle.fen.split(' ')[1] === 'b' ? 'black' : 'white';

    return (
        <Container maxWidth='xl' sx={{ py: 3 }}>
            <Stack sx={{ gap: 2.5 }}>
                <Button
                    component={Link}
                    href='/puzzles/base'
                    color='inherit'
                    startIcon={<ArrowBack />}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    Dojo PuzzleBase
                </Button>

                <PgnBoard
                    key={puzzle.id}
                    pgn={puzzle.solutionPgn}
                    largeBoard
                    slotProps={{
                        pgnText: { hideResultDivider: true },
                        board: { defaultCoordinateSize: PUZZLE_COORDINATE_SIZE },
                    }}
                    showPlayerHeaders={false}
                    startOrientation={orientation}
                    underboardTabs={[]}
                    disableEngine
                    slots={{
                        beforePgnText: <PuzzleInfoPanel puzzle={puzzle} taxonomy={taxonomy} />,
                    }}
                />
            </Stack>
        </Container>
    );
}
