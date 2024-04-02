import { POSITION_NAGS, MOVE_NAGS, nagText, Nag, Node, EditorReducer } from "@bendk/chess-tree"
import React, { useEffect, useState } from 'react'
import { Button, ButtonGroup, IconButton, Popover, Stack, TextField } from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import MenuIcon from '@mui/icons-material/Menu';

interface NagButtonProps {
    node: Node;
    nag: Nag;
    onClick: (nag: Nag) => void
}

const NagButton: React.FC<NagButtonProps> = ({node, nag, onClick}) => {
    const variant = (node.nags.indexOf(nag) !== -1) ? "contained" : undefined

    return <Button onClick={() => onClick(nag)} variant={variant}>{ nagText(nag) }</Button>
}

interface CommentProps {
    node: Node;
    dispatch: React.Dispatch<EditorReducer.Action>,
}

const Comments: React.FC<CommentProps> = ({node, dispatch}) => {
    let [menuAnchor, setMenuAnchor] = useState<HTMLElement|null>(null)
    let [comment, setComment] = useState(node.comment)
    useEffect(() => setComment(node.comment), [node])

    const updateComment = () => {
        if(comment !== node.comment) {
            dispatch({ type: 'set-comment', comment })
        }
    }

    const onNagToggle = (nag: Nag, nagGroup: Nag[]) => {
        let sawNagForButton = false
        const nags = node.nags.filter(n => {
            if (n === nag) {
                // Nag already set, toggle it off
                sawNagForButton = true
                return false
            } else {
                // Otherwise, filter out any nags in this group
                return nagGroup.indexOf(n) === -1
            }
        })
        if (!sawNagForButton) {
            nags.push(nag)
        }
        nags.sort()
        dispatch({ type: 'set-nags', nags })
    }

    const onMoveNagToggle = (nag: Nag) => onNagToggle(nag, MOVE_NAGS)
    const onPositionNagToggle = (nag: Nag) => onNagToggle(nag, POSITION_NAGS)

    return <Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <CommentIcon />
            <IconButton aria-describedby="comment-menu" onClick={e => setMenuAnchor(e.currentTarget)}>
                <MenuIcon />
            </IconButton>
        </Stack>
        <TextField
            multiline
            rows={2}
            variant="outlined"
            value={comment}
            onChange={evt => setComment(evt.target.value)}
            onBlur={() => updateComment()}
        />
        <Popover
            id="comment-menu-warning"
            open={menuAnchor !== null}
            anchorEl={menuAnchor}
            onClose={() => setMenuAnchor(null)}
            sx={{ mb: 1 }}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
        >
            <ButtonGroup variant="outlined" fullWidth={true}>
                <NagButton node={node} nag={Nag.BrilliantMove} onClick={onMoveNagToggle} />
                <NagButton node={node} nag={Nag.GoodMove} onClick={onMoveNagToggle} />
                <NagButton node={node} nag={Nag.InterestingMove} onClick={onMoveNagToggle} />
                <NagButton node={node} nag={Nag.DubiousMove} onClick={onMoveNagToggle} />
                <NagButton node={node} nag={Nag.PoorMove} onClick={onMoveNagToggle} />
                <NagButton node={node} nag={Nag.BlunderMove} onClick={onMoveNagToggle} />
            </ButtonGroup>
            <ButtonGroup variant="outlined" fullWidth={true}>
                <NagButton node={node} nag={Nag.PlusMinusPosition} onClick={onPositionNagToggle} />
                <NagButton node={node} nag={Nag.PlusEqualsPosition} onClick={onPositionNagToggle} />
                <NagButton node={node} nag={Nag.EqualPosition} onClick={onPositionNagToggle} />
                <NagButton node={node} nag={Nag.UnclearPosition} onClick={onPositionNagToggle} />
                <NagButton node={node} nag={Nag.EqualsPlusPosition} onClick={onPositionNagToggle} />
                <NagButton node={node} nag={Nag.MinusPlusPosition} onClick={onPositionNagToggle} />
            </ButtonGroup>
        </Popover>
    </Stack>
}

export default Comments
