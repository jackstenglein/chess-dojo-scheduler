import { DirectoryAccessRole } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { NIL as uuidNil } from 'uuid';
import { fetchDirectory } from './get';

/**
 * Returns true if the provided username has the provided access role (or higher) on the given directory.
 * Recursively checks parent directories until the given user is found.
 * @param owner The owner of the directory to check.
 * @param id The id of the directory to check.
 * @param username The username of the user to check.
 * @param role The role of the user to check.
 */
export async function checkAccess({
    owner,
    id,
    username,
    role,
}: {
    owner: string;
    id: string;
    username: string;
    role: DirectoryAccessRole;
}): Promise<boolean> {
    if (username === owner) {
        return true;
    }

    const directory = await fetchDirectory(owner, id);
    if (!directory) {
        return false;
    }

    if (directory.access?.[username] !== undefined) {
        const userRole = directory.access[username];
        return userRole >= role;
    }

    if (directory.parent !== uuidNil) {
        return checkAccess({ owner, id: directory.parent, username, role });
    }

    return false;
}
