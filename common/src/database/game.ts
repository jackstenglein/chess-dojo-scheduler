import { z } from 'zod';

const gameOrientation = z.enum(['white', 'black']);

/** The orientation of a game. */
export type GameOrientation = z.infer<typeof gameOrientation>;

/** The values for the orientation of a game. */
export const GameOrientations = gameOrientation.enum;

const onlineGameImportType = z.enum([
    'lichessChapter',
    'lichessStudy',
    'lichessGame',
    'chesscomGame',
    'chesscomAnalysis',
]);

export type OnlineGameImportType = z.infer<typeof onlineGameImportType>;

const gameImportType = z.enum([
    ...onlineGameImportType.options,
    'editor',
    'manual',
    'startingPosition',
    'fen',
    'clone',
]);

/** The import type of a game. */
export type GameImportType = z.infer<typeof gameImportType>;

/** The values for the import type of a game. */
export const GameImportTypes = gameImportType.enum;

const onlineGameSchema = z.object({
    /** The URL to import from. */
    url: z.string(),

    /** The PGN text of the game. */
    pgnText: z.string().optional(),

    /** The directory to add the game to. */
    directory: z
        .object({
            /** The owner of the directory. */
            owner: z.string(),

            /** The id of the directory. */
            id: z.string(),
        })
        .optional(),

    /** Whether to publish the game when creating it. */
    publish: z.boolean().optional(),

    /**
     * The orientation of the game. If excluded, the orientation is inferred
     * from the usernames of the players.
     */
    orientation: gameOrientation.optional(),
});

const pgnTextSchema = z.object({
    /** The PGN text of the game. */
    pgnText: z.string(),

    /** The directory to add the game to. */
    directory: z
        .object({
            /** The owner of the directory. */
            owner: z.string(),

            /** The id of the directory. */
            id: z.string(),
        })
        .optional(),

    /** Whether to publish the game when creating it. */
    publish: z.boolean().optional(),

    /**
     * The orientation of the game. If excluded, the orientation is inferred
     * from the usernames of the players.
     */
    orientation: gameOrientation.optional(),
});

/** Verifies a request to create a game. */
export const CreateGameSchema = z.discriminatedUnion('type', [
    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.lichessChapter),
        })
        .merge(onlineGameSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.lichessStudy),
        })
        .merge(onlineGameSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.lichessGame),
        })
        .merge(onlineGameSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.chesscomGame),
        })
        .merge(onlineGameSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.chesscomAnalysis),
        })
        .merge(onlineGameSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.editor),
        })
        .merge(pgnTextSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.manual),
        })
        .merge(pgnTextSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.startingPosition),
        })
        .merge(pgnTextSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.fen),
        })
        .merge(pgnTextSchema),

    z
        .object({
            /** The import type of the game. */
            type: z.literal(GameImportTypes.clone),
        })
        .merge(pgnTextSchema),
]);

/** A request to create a game. */
export type CreateGameRequest = z.infer<typeof CreateGameSchema>;

/** Verifies the import header of a game. */
const gameHeaderSchema = z.object({
    /** The name of the player with white. */
    white: z.string(),

    /** The name of the player with black. */
    black: z.string(),

    /** The date the game was played. */
    date: z.string(),

    /** The result of the game. */
    result: z.string(),
});

/** The import header of a game. */
export type GameHeader = z.infer<typeof gameHeaderSchema>;

/** Verifies the update portion of an update game request. */
const updateGame = z.object({
    /** The cohort of the game to update. */
    cohort: z.string(),

    /** The id of the game to update. */
    id: z.string(),

    /** The eixsting timeline id of the game. */
    timelineId: z.string().optional(),

    /** If specified, updates whether the game should be unlisted. */
    unlisted: z.boolean().optional(),

    /** If specified, updates the default orientation of the game when it is first opened. */
    orientation: gameOrientation.optional(),

    /** The import headers of the game. */
    headers: gameHeaderSchema.optional(),
});

/** Verifies a request to update a game. */
export const UpdateGameSchema = z
    .discriminatedUnion('type', [
        CreateGameSchema.options[0].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[1].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[2].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[3].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[4].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[5].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[6].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[7].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[8].omit({ directory: true }).merge(updateGame),
        CreateGameSchema.options[9].omit({ directory: true }).merge(updateGame),
        z
            .object({
                type: z.undefined(),
            })
            .merge(updateGame),
    ])
    .refine((val) => val.type || val.orientation || val.unlisted !== undefined, {
        message: 'At least one of type, orientation or unlisted is required',
    })
    .transform((val) => {
        val.id = atob(val.id);
        return val;
    });

/** A request to update a game. */
export type UpdateGameRequest = z.infer<typeof UpdateGameSchema>;

/** Verifies a request to delete a game. */
export const DeleteGamesSchema = z
    .object({
        /** The cohort of the game to delete. */
        cohort: z.string(),

        /** The id of the game to delete. */
        id: z.string(),
    })
    .array()
    .min(1)
    .max(100);

/** A request to delete games. Up to 100 games can be deleted in a single call. */
export type DeleteGamesRequest = z.infer<typeof DeleteGamesSchema>;

/** The response to a delete games request. Contains the keys of the successfully deleted games. */
export type DeleteGamesResponse = DeleteGamesRequest;
