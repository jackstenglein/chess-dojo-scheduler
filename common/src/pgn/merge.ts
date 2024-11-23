import { z } from 'zod';

const pgnMergeType = z.enum([
    /** The merged PGN's move data is merged with existing move data. */
    'MERGE',
    /** The merged PGN's move data is discarded. */
    'DISCARD',
    /** The merged PGN's move data overwrites existing move data. */
    'OVERWRITE',
]);

export type PgnMergeType = z.infer<typeof pgnMergeType>;

export const PgnMergeTypes = pgnMergeType.enum;

/** Verifies a request to merge a PGN into a game. */
export const PgnMergeSchema = z.object({
    /** The cohort of the game to merge the PGN into. */
    cohort: z.string(),

    /** The id of the game to merge the PGN into. */
    id: z.string(),

    /** The PGN to merge into the game. */
    pgn: z.string(),

    /** How to handle the comments from the merged PGN. Defaults to MERGE. */
    commentMergeType: pgnMergeType
        .optional()
        .transform((val) => val || PgnMergeTypes.MERGE),

    /** How to handle the NAGs from the merged PGN. Defaults to MERGE. */
    nagMergeType: pgnMergeType.optional().transform((val) => val || PgnMergeTypes.MERGE),

    /** How to handle the drawables from the merged PGN. Defaults to MERGE. */
    drawableMergeType: pgnMergeType
        .optional()
        .transform((val) => val || PgnMergeTypes.MERGE),

    /** Whether to cite the original game in a comment at the end of the added line. */
    citeSource: z.boolean().optional(),

    /** The cohort of the source game the PGN comes from. */
    sourceCohort: z.string().optional(),

    /** The id of the source game the PGN comes from. */
    sourceId: z.string().optional(),
});

/** A request to merge a PGN into a game. */
export type PgnMergeRequest = z.infer<typeof PgnMergeSchema>;
