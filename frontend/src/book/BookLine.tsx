import { Move } from '@bendk/chess-tree'
import React from 'react'
import { Box, Button, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles'

export interface BookLineProps {
    moves: Move[];
    variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "inherit" | "overline" | "subtitle1" | "subtitle2" | "body1" | "body2";
    initialPly?: number;
    sx?: SxProps<Theme>;
    onClick?: (moves: Move[]) => void;
}

export const formatFullMove = (move: string, ply: number) => {
    const moveNum = 1 + Math.trunc(ply / 2);
    if (ply % 2 === 0) {
        return `${moveNum}. ${move}`
    } else {
        return `${moveNum}\u2026 ${move}`
    }
}

const BookLine: React.FC<BookLineProps> = ({ moves, initialPly, variant, sx, onClick }) => {
    const formatMove = (move: string, index: number) => {
        const ply = (initialPly ?? 0) + index
        if (ply % 2 === 0 || index === 0) {
            return formatFullMove(move, ply)
        } else {
            return move
        }
    }

    let content 
    if (onClick === undefined) {
        content = moves.map((move, index) => <Typography key={index} variant={variant ?? "h6"}>{ formatMove(move, index) }</Typography>)
    } else {
        content = moves.map((move, index) => {
            return <Button
                key={index}
                onClick={() => onClick(moves.slice(0, index+1))}
                color="inherit"
                sx={{py: 0, m:0, textTransform: "none", lineHeight: "20px", minWidth: "0px"}}
            >
                <Typography variant={variant ?? "h6"}>{ formatMove(move, index) }</Typography>
            </Button>
        })
    }

    return <Box sx={{ display: "flex", flexWrap: "wrap", minHeight: 32, columnGap: 1, justifyContent: "flex-start", ...sx }}>
        { content }
    </Box>
}

export default BookLine
