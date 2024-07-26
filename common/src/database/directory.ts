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

const directoryVisibility = z.enum(['PUBLIC', 'PRIVATE']);

/** The visibility of a directory. */
export const DirectoryVisibility = directoryVisibility.enum;

const directoryItemType = z.enum(['DIRECTORY', 'OWNED_GAME', 'MASTER_GAME', 'DOJO_GAME']);

/** The type of a directory item. */
export const DirectoryItemType = directoryItemType.enum;

export const DirectoryItemSchema = z.discriminatedUnion('type', [
    z.object({
        /** The type of the directory item. */
        type: z.literal(DirectoryItemType.DIRECTORY),

        /**
         * The id of the directory item. For a subdirectory, this is the id of the directory. */
        id: z.string().uuid(),

        /** The metadata of the directory item. */
        metadata: z.object({
            /** The datetime the directory was created, in ISO format. */
            createdAt: z.string().datetime(),

            /** The datetime the directory was updated, in ISO format. */
            updatedAt: z.string().datetime(),

            /** The visibility of the directory. */
            visibility: directoryVisibility,

            /** The name of the directory. */
            name: z.string(),
        }),
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal(DirectoryItemType.OWNED_GAME),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal(DirectoryItemType.MASTER_GAME),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal(DirectoryItemType.DOJO_GAME),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
]);

export const DirectorySchema = z.object({
    /** The username of the owner of the directory. */
    owner: z.string(),

    /** The id of the directory. The root directory is uuid.MAX. */
    id: z.string().uuid(),

    /** The id of the parent directory. The root directory uses uuid.NIL. */
    parent: z.string().uuid(),

    /** The name of the directory. */
    name: z.string().trim(),

    /** Whether the directory is visible to other users. */
    visibility: directoryVisibility,

    /** The items in the directory, mapped by their ids. */
    items: z.record(z.string(), DirectoryItemSchema),

    /** The datetime the directory was created, in ISO format. */
    createdAt: z.string().datetime(),

    /** The datetime the directory was updated, in ISO format. */
    updatedAt: z.string().datetime(),
});

/** A directory owned by a user. */
export type Directory = z.TypeOf<typeof DirectorySchema>;

/** A single item in a directory. */
export type DirectoryItem = z.TypeOf<typeof DirectoryItemSchema>;
