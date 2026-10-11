'use client';

import {
    PuzzlebasePuzzle,
    PuzzlebaseTaxonomy,
} from '@jackstenglein/chess-dojo-common/src/puzzlebase/api';
import { LocalOffer } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { PuzzlebaseClient } from './puzzlebaseClient';
import { SuggestTagsDialog } from './SuggestTagsDialog';

interface SuggestTagsButtonProps {
    client: PuzzlebaseClient;
    taxonomy: PuzzlebaseTaxonomy;
    puzzle: { id: string; buckets?: string[]; themes?: string[] };
    /** Called with the updated puzzle when the suggestion was applied at once, as it is for a contributor. */
    onApplied?: (puzzle: PuzzlebasePuzzle) => void;
    /** A wider, outlined button, for when there is room. */
    prominent?: boolean;
}

/**
 * The "Suggest tags" button shown when a puzzle ends. A member's suggestion goes to review, and
 * they are thanked. A Puzzle Contributor's is made at once, and they can go on to change more.
 */
export function SuggestTagsButton({
    client,
    taxonomy,
    puzzle,
    onApplied,
    prominent,
}: SuggestTagsButtonProps) {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState<'review' | 'applied'>();

    if (result === 'review') {
        return (
            <Typography variant='body2' color='text.secondary'>
                Thanks. A Puzzle Contributor will review your suggestion.
            </Typography>
        );
    }

    return (
        <Stack sx={{ gap: 0.5, alignItems: prominent ? 'stretch' : 'flex-start' }}>
            {result === 'applied' && (
                <Typography variant='body2' color='success.main'>
                    Tags updated.
                </Typography>
            )}
            <Button
                size={prominent ? 'medium' : 'small'}
                color='inherit'
                variant={prominent ? 'outlined' : 'text'}
                sx={prominent ? { py: 1.25, borderRadius: 2, fontWeight: 700 } : undefined}
                startIcon={<LocalOffer fontSize='small' />}
                onClick={() => setOpen(true)}
            >
                Suggest tags
            </Button>
            {open && (
                <SuggestTagsDialog
                    client={client}
                    taxonomy={taxonomy}
                    puzzle={{
                        id: puzzle.id,
                        buckets: puzzle.buckets ?? [],
                        themes: puzzle.themes ?? [],
                    }}
                    onClose={() => setOpen(false)}
                    onSent={(response) => {
                        setOpen(false);
                        if (response.applied && response.puzzle) {
                            setResult('applied');
                            onApplied?.(response.puzzle);
                        } else {
                            setResult('review');
                        }
                    }}
                />
            )}
        </Stack>
    );
}
