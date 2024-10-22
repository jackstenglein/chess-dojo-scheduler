import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { NIL as uuidNil } from 'uuid';
import { fetchDirectory } from './get';

/**
 * Returns true if the provided username has the provided access role (or higher) on the given directory.
 * Recursively checks parent directories until the given user is found.
 * @param owner The owner of the directory to check.
 * @param id The id of the directory to check.
 * @param username The username of the user to check.
 * @param role The role of the user to check.
 * @param directory The initial directory to check. If undefined, it will be fetched.
 * @param skipRecursion Whether to skip recursion and only check access for the given directory.
 * @returns True if the provided username has the provided access role or higher.
 */
export async function checkAccess(params: {
    owner: string;
    id: string;
    username: string;
    role: DirectoryAccessRole;
    directory?: Directory;
    skipRecursion?: boolean;
}): Promise<boolean> {
    const currRole = await getAccessRole(params);
    return compareRoles(params.role, currRole);
}

/**
 * Gets the access role for the provided username on the given directory. Recursively checks parent
 * directories until the given user is found.
 * @param owner The owner of the directory to check.
 * @param id The id of the directory to check.
 * @param username The username of the user to check.
 * @param directory The initial directory to check. If undefined, it will be fetched.
 * @param skipRecursion Whether to skip recursion and only check access for the given directory.
 * @returns The access role of the provided username for the given directory.
 */
export async function getAccessRole({
    owner,
    id,
    username,
    directory,
    skipRecursion,
}: {
    owner: string;
    id: string;
    username: string;
    directory?: Directory;
    skipRecursion?: boolean;
}): Promise<DirectoryAccessRole | undefined> {
    if (username === owner) {
        return DirectoryAccessRole.Owner;
    }

    directory = directory ?? (await fetchDirectory(owner, id));
    if (!directory) {
        return undefined;
    }

    if (directory.access?.[username] !== undefined) {
        return directory.access?.[username];
    }

    if (!skipRecursion && directory.parent !== uuidNil) {
        return getAccessRole({ owner, id: directory.parent, username });
    }

    return undefined;
}
