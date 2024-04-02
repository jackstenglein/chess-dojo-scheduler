import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Box, Stack } from '@mui/material';
import BackHandIcon from '@mui/icons-material/BackHand';
import DeleteIcon from '@mui/icons-material/Delete';

import { Chessground } from 'chessground';
import { Key, Piece } from 'chessground/types';
import { Api as BoardApi } from 'chessground/api';

const pieceMap: {[index: string]: Piece} = {
    wk: { color: "white", role: "king"},
    wq: { color: "white", role: "queen"},
    wr: { color: "white", role: "rook"},
    wb: { color: "white", role: "bishop"},
    wn: { color: "white", role: "knight"},
    wp: { color: "white", role: "pawn"},
    bk: { color: "black", role: "king"},
    bq: { color: "black", role: "queen"},
    br: { color: "black", role: "rook"},
    bb: { color: "black", role: "bishop"},
    bn: { color: "black", role: "knight"},
    bp: { color: "black", role: "pawn"},
}

interface BoardEditorButtonProps {
    currentButton: string;
    buttonId: string;
    children: React.ReactNode;
    board: BoardApi|undefined;
    onClick: (buttonId: string) => void;
}

const BoardEditorButton: React.FC<BoardEditorButtonProps> = ({ currentButton, buttonId, children, board, onClick }) => {
    const sx: any = {
        width: "12%",
        cursor: "pointer",
        p: 1,
        border: "transparent",
        "&:hover": {
            bgcolor: "secondary.main",
            border: "transparent",
        },
    }
    if (currentButton !== buttonId) {
        sx.bgcolor = "grey"
    }
    const onDragStart = useCallback((evt: React.MouseEvent) => {
        if (board && buttonId in pieceMap) {
            board.dragNewPiece(pieceMap[buttonId], evt.nativeEvent, true)
        }
            evt.preventDefault()
    }, [board, buttonId])

    return <Button
        variant={currentButton === buttonId ? "contained" : "outlined"}
        sx={sx}
        onDragStart={onDragStart}
        onClick={() => onClick(buttonId)}
    ><Stack justifyContent="flex-end" alignItems="center">{children}</Stack>
    </Button>
}

interface BoardEditorProps {
    onUpdate: (position: string) => void;
    color: "w"|"b";
    size: string;
}

const BoardEditor: React.FC<BoardEditorProps> = ({onUpdate, color, size}) => {
    const pieceStyle = { width: "100%", height: "100%" }
    const [currentButton, setCurrentButton] = useState<string>("hand")
    const boardEltRef = useRef()
    const [board, setBoard] = useState<BoardApi>()
    const orientation = (color === "w") ? "white" : "black"

    const onSquareClick = useCallback((square: Key) => {
        const piece = pieceMap[currentButton]
        if(board && piece) {
            board.newPiece(piece, square)
        } else if (board && currentButton === "delete") {
            board.setPieces(new Map([[square, undefined]]))
            onUpdate(board.getFen())
        }
    }, [board, currentButton, onUpdate])

    const onButtonClick = useCallback((buttonId: string) => {
        setCurrentButton(buttonId)
    }, [setCurrentButton])

    // Initialize the board
    useEffect(() => {
        if (boardEltRef.current && !board) {
            setBoard(Chessground(boardEltRef.current, {
                fen: "8/8/8/8/8/8/8/8 w - - 0 1",
                orientation,
                // Only allow dragging, no click -> click moves
                movable: { free: true },
                selectable: { enabled: false },
            }))
        }
    }, [board, orientation, onSquareClick, onUpdate])

    // Set the board event handlers as they change
    useEffect(() => {
        if (board) {
            board.set({
                events: {
                    change: () => onUpdate(board.getFen()),
                    select: onSquareClick,
                }
            })
        }
    }, [board, onSquareClick, onUpdate])

    // Ensure the board's orientation matches the color to move
    useEffect(() => board?.set({orientation}), [board, orientation])

    return <Stack spacing={1}>
            <Stack direction="row" width={size} spacing={1} justifyContent="space-between">
                <BoardEditorButton currentButton={currentButton} buttonId="hand" onClick={onButtonClick} board={board}>
                    <BackHandIcon sx={{ color: "white", width: "75%", height: "75%" }} />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="wk" onClick={onButtonClick} board={board}>
                    <img alt="white king" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wk.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="wq" onClick={onButtonClick} board={board}>
                    <img alt="white queen" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wq.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="wr" onClick={onButtonClick} board={board}>
                    <img alt="white rook" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wr.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="wb" onClick={onButtonClick} board={board}>
                    <img alt="white bishop" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wb.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="wn" onClick={onButtonClick} board={board}>
                    <img alt="white knight" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wn.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="wp" onClick={onButtonClick} board={board}>
                    <img alt="white pawn" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wp.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="delete" onClick={onButtonClick} board={board}>
                    <DeleteIcon sx={{ color: "white", width: "85%", height: "85%" }} />
                </BoardEditorButton>
            </Stack>
            <Box ref={boardEltRef} width={size} height={size} />
            <Stack direction="row" width={size} spacing={1} justifyContent="space-between">
                <BoardEditorButton currentButton={currentButton} buttonId="hand" onClick={onButtonClick} board={board}>
                    <BackHandIcon sx={{ color: "white", width: "75%", height: "75%" }} />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="bk" onClick={onButtonClick} board={board}>
                    <img alt="white king" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bk.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="bq" onClick={onButtonClick} board={board}>
                    <img alt="white queen" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bq.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="br" onClick={onButtonClick} board={board}>
                    <img alt="white rook" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/br.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="bb" onClick={onButtonClick} board={board}>
                    <img alt="white bishop" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bb.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="bn" onClick={onButtonClick} board={board}>
                    <img alt="white knight" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bn.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="bp" onClick={onButtonClick} board={board}>
                    <img alt="white pawn" style={pieceStyle} src="https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bp.png" />
                </BoardEditorButton>
                <BoardEditorButton currentButton={currentButton} buttonId="delete" onClick={onButtonClick} board={board}>
                    <DeleteIcon sx={{ color: "white", width: "85%", height: "85%" }} />
                </BoardEditorButton>
            </Stack>
    </Stack>
}

export default BoardEditor
