import { Node, calcNodeInfo, EditorReducer } from "@bendk/chess-tree"
import React, { useCallback } from 'react';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';

export interface LineMenuProps {
    menuAnchor: HTMLElement;
    currentNode: Node;
    dispatch: React.Dispatch<EditorReducer.Action>;
    onClose: () => void;
}

const LineMenu: React.FC<LineMenuProps> = ({menuAnchor, currentNode, dispatch, onClose}) => {
    const lineCount = calcNodeInfo(currentNode).lineCount
    const title = (lineCount === 1) ? "1 line" : `${lineCount} lines`
    const deleteLine = useCallback(() => {
        dispatch({type: 'delete-branch'})
        onClose()
    }, [dispatch, onClose])

    const deleteFromHere = useCallback(() => {
        dispatch({type: 'delete-node'})
        onClose()
    }, [dispatch, onClose])

    return <Menu
        id="line-menu"
        anchorEl={menuAnchor}
        anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        open={menuAnchor !== null}
        onClose={onClose}
    >
        <MenuItem disabled={true}>
            <ListItemText inset={true}>{ title }</ListItemText>
        </MenuItem>
        <MenuItem onClick={deleteLine}>
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            <ListItemText>Delete line</ListItemText>
        </MenuItem>
        <MenuItem onClick={deleteFromHere}>
            <ListItemIcon><ContentCutIcon /></ListItemIcon>
            <ListItemText>Delete from here</ListItemText>
        </MenuItem>
        <MenuItem divider={true} onClick={onClose}>
            <ListItemIcon><DriveFileMoveIcon /></ListItemIcon>
            <ListItemText>Move to other book</ListItemText>
        </MenuItem>
        <MenuItem disabled={true}>
            <ListItemText inset={true}>Priority</ListItemText>
        </MenuItem>
        <MenuItem>
            <ListItemText inset={true}>High</ListItemText>
        </MenuItem>
        <MenuItem>
            <ListItemIcon><CheckIcon /></ListItemIcon>
            <ListItemText>Normal</ListItemText>
        </MenuItem>
        <MenuItem>
            <ListItemText inset={true}>Low</ListItemText>
        </MenuItem>
    </Menu>
};

export default LineMenu;
