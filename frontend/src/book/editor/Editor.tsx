import { Node, childCount, getDescendant, EditorReducer } from "@bendk/chess-tree"
import { Chess } from '@jackstenglein/chess';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { ChessContext, ChessContextType } from '../../board/pgn/PgnBoard';
import Explorer from '../../board/pgn/explorer/Explorer';
import { BoardApi, reconcile } from '../../board/Board';
import BookBoard from '../BookBoard'
import BookBoardControls from '../BookBoardControls'
import BookLine from '../BookLine'
import EditControls from './EditControls'
import Comments from './Comments'
import File from './File'
import VariationList from './VariationList'

interface EditorProps {
    name: string;
    initialPly: number;
    initialPosition: string;
    initialRootNode: Node;
    showDatabase: boolean;
    color: "w"|"b";
    onSave: (rootNode: Node) => void;
    onDiscard: () => void;
}

const Editor: React.FC<EditorProps> = ({name, initialPly, initialPosition, initialRootNode, showDatabase, color, onSave, onDiscard}) => {
    const [chessContext, setChessContext] = useState<ChessContextType>({});
    const [{node: rootNode, moves, canUndo, canRedo}, editorDispatch] = useReducer(
        EditorReducer.reduce,
        initialRootNode,
        EditorReducer.initialState
    )
    const currentNode = getDescendant(rootNode, moves)
    const rootNodeEmpty = childCount(rootNode) === 0
    const onBoardInitialize = useCallback((board: BoardApi, chess: Chess) => {
        setChessContext({...chessContext, board, chess})
    }, [chessContext, setChessContext])
    const dispatch = useCallback((action: EditorReducer.Action) => {
        editorDispatch(action)
        if (action.type === 'set-moves') {
            const {chess, board} = chessContext
            if (chess) {
                chess.seek(null)
                chess.pgn.history.clear()
                for(const move of action.moves) {
                    if (chess.move(move) === null) {
                        throw Error(`Illegal move passed to dispatch: ${action.moves}`)
                    }

                }
                if(board) {
                    reconcile(chess, board)
                }
            }
        }
    }, [editorDispatch, chessContext])

    useEffect(() => chessContext.board?.set({
        orientation: (color === "w") ? "white" : "black",
    }), [chessContext.board, color])

    return <ChessContext.Provider value={chessContext}>
        <Box
            sx={{ 
                py: 5,
                mx: 5,
                '--explorer-width': '400px',
                '--sidebar-width': '350px',
                '--gap': '80px',
                '--board-size': 'calc(min(600px, 100vw - var(--sidebar-width) - var(--gap)))',
                maxWidth: 'calc(var(--board-size) + var(--sidebar-width) + var(--explorer-width) + (2 * var(--gap)))',
                margin: 'auto',
            }}
        >
            <Stack>
                <Stack direction="row" spacing="var(--gap)">
                    <Box width="var(--explorer-width)">
                        { showDatabase ? <Explorer /> : null }
                    </Box>
                    <Stack width="var(--board-size)">
                        <Typography variant="h4" pb={2}>Editing: { name }</Typography>
                        <BookBoard
                            size="var(--board-size)"
                            initialPosition={initialPosition}
                            annotations={currentNode?.annotations}
                            onInitialize={onBoardInitialize}
                            onMovesChange={moves => dispatch({type: 'set-moves', moves})}
                            onAnnotationsChange={annotations => dispatch({type: 'set-annotations', annotations})}
                        />
                        <BookBoardControls onMovesChange={moves => dispatch({type: 'set-moves', moves})}/>
                        <Stack direction="row" pt={1}>
                            <BookLine moves={moves} initialPly={initialPly} sx={{ flexGrow: 1 }} />
                            <EditControls
                                currentNode={currentNode}
                                rootNodeEmpty={rootNodeEmpty}
                                canUndo={canUndo}
                                canRedo={canRedo}
                                dispatch={dispatch}
                            />
                        </Stack>
                    </Stack>
                    <Stack width="var(--sidebar-width)" justifyContent="space-between">
                        <File
                            hasChanges={canUndo || canRedo}
                            rootNode={rootNode}
                            onSave={onSave}
                            onDiscard={onDiscard}
                        />
                        { (currentNode && currentNode !== rootNode) ? <Comments node={currentNode} dispatch={dispatch} /> : null }
                    </Stack>
                </Stack>
                <VariationList
                    initialPly={initialPly}
                    rootNode={rootNode}
                    moves={moves}
                    dispatch={dispatch}
                    sx={{pt: 4}}
                />
            </Stack>
        </Box>
    </ChessContext.Provider>
};

export default Editor;
