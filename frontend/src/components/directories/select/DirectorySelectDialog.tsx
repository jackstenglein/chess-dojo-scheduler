import { DirectoryBreadcrumbs } from '@/components/profile/directories/DirectoryBreadcrumbs';
import { useDirectory } from '@/components/profile/directories/DirectoryCache';
import LoadingPage from '@/loading/LoadingPage';
import { isSelectableDirectory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Box,
    Dialog,
    DialogActions,
    DialogActionsProps,
    DialogContent,
    DialogProps,
    DialogTitle,
    DialogTitleProps,
    List,
} from '@mui/material';
import { NavigationMenu } from '../navigation/NavigationMenu';
import { DirectorySelectListItem } from './DirectorySelectListItem';

interface DirectorySelectDialogProps {
    /** The currently selected directory. */
    value: {
        owner: string;
        id: string;
    };

    /** Callback invoked when the user selects a new directory. */
    onChange: (value: { owner: string; id: string }) => void;

    slotProps: {
        dialog: DialogProps;
        dialogTitle: DialogTitleProps;
        dialogActions: DialogActionsProps;
    };
}

export function DirectorySelectDialog({ value, onChange, slotProps }: DirectorySelectDialogProps) {
    const { directory, request } = useDirectory(value.owner, value.id);

    return (
        <Dialog {...slotProps.dialog}>
            <DialogTitle {...slotProps.dialogTitle} sx={{ ...slotProps.dialogTitle.sx, pb: 0 }} />
            <DialogContent>
                <Box sx={{ mt: 1, mb: 2 }}>
                    <NavigationMenu
                        namespace='directorySelectDialog'
                        owner={value.owner}
                        id={value.id}
                        defaultValue={false}
                        enabled
                        horizontal
                        hideAllUploads
                        onClick={onChange}
                    />
                </Box>

                {directory ? (
                    <>
                        <DirectoryBreadcrumbs
                            owner={value.owner}
                            id={value.id}
                            variant='body1'
                            onClick={(item) => onChange({ owner: item.owner, id: item.id })}
                        />

                        <List>
                            {Object.values(directory.items)
                                .filter((item) => isSelectableDirectory(item.id))
                                .sort((lhs, rhs) => lhs.type.localeCompare(rhs.type))
                                .map((item) => (
                                    <DirectorySelectListItem
                                        key={item.id}
                                        parent={directory}
                                        item={item}
                                        onClick={onChange}
                                    />
                                ))}
                        </List>
                    </>
                ) : request.isLoading() ? (
                    <LoadingPage />
                ) : null}
            </DialogContent>
            <DialogActions {...slotProps.dialogActions} />
        </Dialog>
    );
}
