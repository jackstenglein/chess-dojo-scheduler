import { z } from 'zod';

const gameMetadataSchema = z.object({
    /** The cohort of the game. */
    cohort: z.string(),

    /** The id of the game. */
    id: z.string(),

    /** The username of the owner of the game. */
    owner: z.string(),

    /** The display name of the owner of the game. */
    ownerDisplayName: z.string(),

    /** The datetime the game was uploaded to the database, in ISO format. */
    createdAt: z.string().datetime(),
});

export const DirectoryItemSchema = z.discriminatedUnion('type', [
    z.object({
        /** The type of the directory item. */
        type: z.literal('DIRECTORY'),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: z.object({
            /** The datetime the directory was created, in ISO format. */
            createdAt: z.string().datetime(),

            /** The datetime the directory was updated, in ISO format. */
            updatedAt: z.string().datetime(),
        }),
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal('OWNED_GAME'),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal('MASTER_GAME'),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal('DOJO_GAME'),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
]);

export const DirectorySchema = z.object({
    /** The username of the owner of the directory. */
    owner: z.string(),

    /** The name of the directory. */
    name: z.string().regex(/^[ .a-zA-Z0-9_-]+$/),

    /** Whether the directory is visible to other users. */
    visibility: z.enum(['PUBLIC', 'PRIVATE']),

    /** The items in the directory, mapped by their ids. */
    items: z.record(z.string(), DirectoryItemSchema),
});

/** A directory owned by a user. */
export type Directory = z.TypeOf<typeof DirectorySchema>;

/** A single item in a directory. */
export type DirectoryItem = z.TypeOf<typeof DirectoryItemSchema>;
