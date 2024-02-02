import { TrainingSummary } from '@bendk/chess-tree'
import React, { Fragment, useCallback, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import {Card, CardActions, CardActionArea, CardContent, CardMedia, IconButton, LinearProgress, Menu, MenuItem, Typography} from '@mui/material';
import Board from '../../board/Board';

interface TrainingCardProps {
    training: TrainingSummary;
    width: number;
    onRestart: (trainingId: string) => void;
    onDelete: (trainingId: string) => void;
}

const TrainingCard: React.FC<TrainingCardProps> = ({training, width, onRestart, onDelete}) => {
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement|null>(null);

    let orientation: "white"|"black" = "white"
    if (training.selection.type === "opening" && training.selection.color === "b") {
        orientation = "black"
    }

    const inProgress = training.linesTrained < training.totalLines

    const onClickDelete = useCallback(() => {
        onDelete(training.id)
        setMenuAnchor(null)
    }, [training.id, onDelete, setMenuAnchor])

    const onClickRestart = useCallback(() => {
        onRestart(training.id)
        setMenuAnchor(null)
    }, [training.id, onRestart, setMenuAnchor])

    const content = <Fragment>
        <CardMedia
            sx={{height: width}}
            children=<Board
                config={{
                    fen: training.position,
                    viewOnly: true,
                    orientation,
                }}
            />
        />
        <CardContent>
            <Typography variant="body1">{ training.name }</Typography>
            <Typography variant="body2" pb={1}>{training.linesTrained}/{training.totalLines} lines trained</Typography>
            <LinearProgress variant="determinate" value={Math.round(training.linesTrained * 100 / training.totalLines)} />
        </CardContent>
    </Fragment>

    return <Card sx={{width: width, height: "400px"}}>
        { inProgress ?
            <CardActionArea component={RouterLink} to={`/book/training/${training.id}`}>{content }</CardActionArea> :
            content
        }
        <CardActions sx={{ justifyContent: "flex-end" }}>
            <IconButton onClick={(elt) => setMenuAnchor(elt.currentTarget)}>
                <MenuIcon />
            </IconButton>
        </CardActions>
        <Menu open={menuAnchor !== null} anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={onClickRestart}>Restart</MenuItem>
            <MenuItem onClick={onClickDelete}>Delete</MenuItem>
        </Menu>
    </Card>
}

export default TrainingCard
