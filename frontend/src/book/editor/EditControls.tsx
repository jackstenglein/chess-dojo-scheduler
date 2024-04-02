import { Node, EditorReducer } from "@bendk/chess-tree"
import React, { useState } from 'react';
import { Button, IconButton, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PolylineIcon from '@mui/icons-material/Polyline';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import LineMenu from './LineMenu';

export interface EditControlsProps {
    currentNode: Node|null;
    rootNodeEmpty: boolean;
    canUndo: boolean;
    canRedo: boolean;
    dispatch: React.Dispatch<EditorReducer.Action>,
}

const EditControls: React.FC<EditControlsProps> = ({currentNode, rootNodeEmpty, canUndo, canRedo, dispatch}) => {
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement|null>(null)

    let buttonComponent
    if (currentNode === null) {
        buttonComponent = <Button variant="outlined" onClick={() => dispatch({type: 'add'})}><AddIcon /></Button>
    } else if (!rootNodeEmpty) {
        buttonComponent = <Button aria-label="Line menu" variant="outlined" onClick={evt => setMenuAnchor(evt.currentTarget)}>
            <PolylineIcon />
        </Button>
    } else {
        buttonComponent = <Button aria-label="Line menu" variant="outlined" disabled={true}>
            <PolylineIcon />
        </Button>
    }

    return <Stack>
        { buttonComponent }
        { (currentNode && menuAnchor) ?
            <LineMenu
                currentNode={currentNode}
                menuAnchor={menuAnchor}
                dispatch={dispatch}
                onClose={() => setMenuAnchor(null)}
            /> : null
        }
        <Stack direction="row">
            <IconButton disabled={!canUndo} onClick={() => dispatch({type: 'undo'})}><UndoIcon /></IconButton>
            <IconButton disabled={!canRedo} onClick={() => dispatch({type: 'redo'})}><RedoIcon /></IconButton>
        </Stack>
    </Stack>
};

export default EditControls;
