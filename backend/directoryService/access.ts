import {
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
 */
export async function checkAccess({
    owner,
    id,
    username,
    role,
    directory,
    skipRecursion,
}: {
    owner: string;
    id: string;
    username: string;
    role: DirectoryAccessRole;
    directory?: Directory;
    skipRecursion?: boolean;
}): Promise<boolean> {
    if (username === owner) {
        return true;
    }

    directory = directory ?? (await fetchDirectory(owner, id));
    if (!directory) {
        return false;
    }

    if (directory.access?.[username] !== undefined) {
        return compareRoles(role, directory.access[username]);
    }

    if (!skipRecursion && directory.parent !== uuidNil) {
        return checkAccess({ owner, id: directory.parent, username, role });
    }

    return false;
}

/**
 * Returns true if currRole has permissions greater than or equal to minRole.
 * @param minRole The minimum required role.
 * @param currRole The current role to check.
 */
function compareRoles(
    minRole: DirectoryAccessRole,
    currRole: DirectoryAccessRole | undefined,
): boolean {
    switch (minRole) {
        case DirectoryAccessRole.Viewer:
            return currRole !== undefined;
        case DirectoryAccessRole.Editor:
            return (
                currRole === DirectoryAccessRole.Editor ||
                currRole === DirectoryAccessRole.Admin
            );
        case DirectoryAccessRole.Admin:
            return currRole === DirectoryAccessRole.Admin;
    }
}
