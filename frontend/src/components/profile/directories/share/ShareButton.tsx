import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { PersonAddAlt1 } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useState } from 'react';
import { ShareDialog } from './ShareDialog';

export const ShareButton = ({
    directory,
    accessRole,
}: {
    directory: Directory;
    accessRole?: DirectoryAccessRole;
}) => {
    const [open, setOpen] = useState(false);

    if (!compareRoles(DirectoryAccessRole.Admin, accessRole)) {
        return null;
    }

    return (
        <>
            <Button variant='contained' startIcon={<PersonAddAlt1 />} onClick={() => setOpen(true)}>
                Share
            </Button>

            {open && <ShareDialog directory={directory} onClose={() => setOpen(false)} />}
        </>
    );
};
