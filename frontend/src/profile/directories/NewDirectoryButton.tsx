import { CreateDirectoryResponse } from '@/api/directoryApi';
import { Directory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { CreateNewFolder } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useState } from 'react';
import { NewDirectoryDialog } from './NewDirectoryDialog';

export const NewDirectoryButton = ({
    parent,
    onSuccess,
}: {
    parent: string;
    onSuccess: (parent: Directory) => void;
}) => {
    const [open, setOpen] = useState(false);

    const onCreate = (resp: CreateDirectoryResponse) => {
        onSuccess(resp.parent);
        setOpen(false);
    };

    return (
        <>
            <Button
                variant='contained'
                startIcon={<CreateNewFolder />}
                onClick={() => setOpen(true)}
            >
                New Folder
            </Button>

            {open && (
                <NewDirectoryDialog
                    parent={parent}
                    onSuccess={onCreate}
                    onCancel={() => setOpen(false)}
                />
            )}
        </>
    );
};
