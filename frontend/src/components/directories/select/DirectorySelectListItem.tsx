import { RenderPlayers } from '@/games/list/GameListItem';
import CohortIcon from '@/scoreboard/CohortIcon';
import {
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
    SHARED_DIRECTORY_ID,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { ChevronRight, Folder } from '@mui/icons-material';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

/**
 * Renders a list item to select directory items. Games are rendered but disabled.
 */
export function DirectorySelectListItem({
    parent,
    item,
    onClick,
    disabled,
}: {
    parent: Pick<Directory, 'owner' | 'id'>;
    item: DirectoryItem;
    onClick: (value: { owner: string; id: string }) => void;
    disabled?: boolean;
}) {
    const handleClick = () => {
        if (parent.id === SHARED_DIRECTORY_ID) {
            onClick({ owner: item.addedBy ?? parent.owner, id: item.id });
        } else {
            onClick({ owner: parent.owner, id: item.id });
        }
    };

    if (item.type === DirectoryItemTypes.DIRECTORY) {
        return (
            <ListItemButton disabled={disabled} onClick={handleClick}>
                <ListItemIcon>
                    <Folder />
                </ListItemIcon>
                <ListItemText primary={item.metadata.name} />
                <ChevronRight />
            </ListItemButton>
        );
    }

    return (
        <ListItemButton disabled>
            <ListItemIcon>
                <CohortIcon
                    cohort={item.metadata.cohort}
                    tooltip={item.metadata.cohort}
                    size={25}
                />
            </ListItemIcon>
            <ListItemText primary={RenderPlayers(item.metadata)} />
        </ListItemButton>
    );
}
