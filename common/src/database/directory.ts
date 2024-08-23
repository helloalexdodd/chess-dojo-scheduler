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
    createdAt: z.string(),

    /** The player with the white pieces. */
    white: z.string(),

    /** The player with the black pieces. */
    black: z.string(),

    /** The elo of the player with the white pieces. */
    whiteElo: z.string().optional(),

    /** The elo of the player with the black pieces. */
    blackElo: z.string().optional(),

    /** The result of the game. */
    result: z.string(),
});

const directoryVisibility = z.enum(['PUBLIC', 'PRIVATE']);

/** The visibility of a directory. */
export const DirectoryVisibility = directoryVisibility.enum;

const directoryItemType = z.enum(['DIRECTORY', 'OWNED_GAME', 'MASTER_GAME', 'DOJO_GAME']);

export type DirectoryItemType = z.infer<typeof directoryItemType>;

/** The type of a directory item. */
export const DirectoryItemTypes = directoryItemType.enum;

export const DirectoryItemSchema = z.discriminatedUnion('type', [
    z.object({
        /** The type of the directory item. */
        type: z.literal(DirectoryItemTypes.DIRECTORY),

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
            name: z.string().trim().max(100),
        }),
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal(DirectoryItemTypes.OWNED_GAME),

        /** The id of the directory item. For a game, this is the value cohort#id. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal(DirectoryItemTypes.MASTER_GAME),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
    z.object({
        /** The type of the directory item. */
        type: z.literal(DirectoryItemTypes.DOJO_GAME),

        /** The id of the directory item. */
        id: z.string(),

        /** The metadata of the directory item. */
        metadata: gameMetadataSchema,
    }),
]);

/** The id of the home directory. */
export const HOME_DIRECTORY_ID = 'home';

/** The ids of default directories. */
const DEFAULT_DIRECTORIES = [HOME_DIRECTORY_ID];

/**
 * Returns true if the given id is a default directory.
 * @param id The id to check.
 */
export function isDefaultDirectory(id: string): boolean {
    return DEFAULT_DIRECTORIES.includes(id);
}

export const DirectorySchema = z.object({
    /** The username of the owner of the directory. */
    owner: z.string(),

    /**
     * The id of the directory. Most directories are v4 UUIDs, but some have
     * fixed, known values:
     *   - The home directory is `home`.
     */
    id: z.union([z.string().uuid(), z.literal(HOME_DIRECTORY_ID)]),

    /** The id of the parent directory. Top-level directories (home) use uuid.NIL. */
    parent: z.union([z.string().uuid(), z.literal(HOME_DIRECTORY_ID)]),

    /** The name of the directory. */
    name: z.string().trim().max(100),

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

/** A subdirectory in another directory. */
export type DirectoryItemSubdirectory = z.infer<(typeof DirectoryItemSchema.options)[0]>;

/** A directory item representing a game. */
export type DirectoryItemGame = z.infer<
    | (typeof DirectoryItemSchema.options)[1]
    | (typeof DirectoryItemSchema.options)[2]
    | (typeof DirectoryItemSchema.options)[3]
>;

/** The metadata of a game in a directory. */
export type DirectoryItemGameMetadata = z.infer<typeof gameMetadataSchema>;

export const CreateDirectorySchema = DirectorySchema.pick({
    id: true,
    parent: true,
    name: true,
    visibility: true,
});

/** A request to create a directory. */
export type CreateDirectoryRequest = z.infer<typeof CreateDirectorySchema>;

export const UpdateDirectorySchema = DirectorySchema.pick({
    id: true,
    name: true,
    visibility: true,
}).partial({ name: true, visibility: true });

/** A request to update a directory. */
export type UpdateDirectoryRequest = z.infer<typeof UpdateDirectorySchema>;

/** Verifies a request to delete a directory. */
export const DeleteDirectorySchema = DirectorySchema.pick({
    id: true,
});

/** A request to delete a directory. */
export type DeleteDirectoryRequest = z.infer<typeof DeleteDirectorySchema>;

/**
 * Verifies a request to add an item to a directory. Currently, only
 * games are handled by this request. Subdirectories can be added using
 * the create directory request.
 */
export const AddDirectoryItemSchema = DirectorySchema.pick({
    id: true,
}).merge(
    z.object({
        game: gameMetadataSchema,
    }),
);

/** A request to add an item to a directory. */
export type AddDirectoryItemRequest = z.infer<typeof AddDirectoryItemSchema>;

/**
 * Verifies a request to remove an item from a directory. Currently, only
 * games are handled by this request. Subdirectories can be removed using
 * the delete directory request. */
export const RemoveDirectoryItemSchema = z.object({
    /** The id of the directory to remove the item from. */
    directoryId: DirectorySchema.shape.id,

    /** The id of the item to remove. */
    itemId: z.string(),
});

/** A request to remove an item from a directory. */
export type RemoveDirectoryItemRequest = z.infer<typeof RemoveDirectoryItemSchema>;

/**
 * Verifies a request to move items between directories.
 */
export const MoveDirectoryItemsSchema = z
    .object({
        /** The id of the directory currently containing the items. */
        source: DirectorySchema.shape.id,

        /** The id of the directory to move the items into. */
        target: DirectorySchema.shape.id,

        /** The ids of the items to move. */
        items: z.string().array().nonempty(),
    })
    .refine((val) => val.source !== val.target, {
        message: 'source/target directories must be different',
    });

/** A request to move items between directories. */
export type MoveDirectoryItemsRequest = z.infer<typeof MoveDirectoryItemsSchema>;