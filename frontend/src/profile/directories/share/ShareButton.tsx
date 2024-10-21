import { useAuth } from '@/auth/Auth';
import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { PersonAddAlt1 } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useState } from 'react';
import { ShareDialog } from './ShareDialog';

export const ShareButton = ({ directory }: { directory: Directory }) => {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

    if (
        !user?.username ||
        (user.username !== directory.owner &&
            !compareRoles(DirectoryAccessRole.Admin, directory.access?.[user.username]))
    ) {
        return null;
    }

    return (
        <>
            <Button
                variant='contained'
                startIcon={<PersonAddAlt1 />}
                onClick={() => setOpen(true)}
            >
                Share
            </Button>

            {open && <ShareDialog directory={directory} onClose={() => setOpen(false)} />}
        </>
    );
};
