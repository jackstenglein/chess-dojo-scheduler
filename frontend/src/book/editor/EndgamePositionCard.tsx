import { EndgamePosition } from '@bendk/chess-tree'
import React, { useCallback, useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import {Card, CardActions, CardActionArea, CardMedia, IconButton, Menu, MenuItem} from '@mui/material';
import Board from '../../board/Board';

interface EndgamePositionCardProps {
    position: EndgamePosition;
    width: number;
    onSelect: (position: EndgamePosition) => void;
    onDelete: (position: EndgamePosition) => void;
}

const EndgamePositionCard: React.FC<EndgamePositionCardProps> = ({position, width, onDelete, onSelect}) => {
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement|null>(null);

    const onClickDelete = useCallback(() => {
        onDelete(position)
        setMenuAnchor(null)
    }, [position, onDelete, setMenuAnchor])


    return <Card sx={{ width }}>
        <CardActionArea onClick={() => onSelect(position)}>
            <CardMedia
                sx={{height: width}}
                children=<Board
                    config={{
                        fen: position.position,
                        viewOnly: true,
                        orientation: (position.color === "w") ? "white" : "black",
                    }}
                />
            />
        </CardActionArea>
        <CardActions sx={{ justifyContent: "flex-end" }}>
            <IconButton onClick={(elt) => setMenuAnchor(elt.currentTarget)}>
                <MenuIcon />
            </IconButton>
        </CardActions>
        <Menu open={menuAnchor !== null} anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={onClickDelete}>Delete</MenuItem>
        </Menu>
    </Card>
}

export default EndgamePositionCard

