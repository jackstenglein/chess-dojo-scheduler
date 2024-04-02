import { EditorReducer, Move, Nag, Node, ViewNode, childCount, getDescendant, nagText, viewNodeTree } from "@bendk/chess-tree"
import React, { Fragment, useCallback, useState } from 'react'
import { Box, Button, Link, Paper, Stack, Typography } from '@mui/material'
import { SxProps, Theme } from '@mui/material/styles'
import MenuBook from '@mui/icons-material/MenuBook'
import LineMenu from "./LineMenu"
import { formatFullMove } from "../BookLine"

const MAX_BRANCHES = 8
const MAX_DEPTH = 10

interface NodeTreeProps {
    childNodes: ViewNode[];
    initialPly: number;
    leadingMoves: Move[];
    onClickMove: (moves: Move[]) => void;
    onContextMenu: (moves: Move[], event: React.MouseEvent<HTMLElement>) => void;
    sx?: SxProps<Theme>;
    currentMoves: Move[];
}

const NodeTree: React.FC<NodeTreeProps> = ({childNodes, initialPly, leadingMoves, onClickMove, onContextMenu, sx, currentMoves}) => {
    let content
    if (leadingMoves.length > 0) {
        content = <Stack direction="row" alignItems="flex-start">
                <Button
                    onClick={onClickMove.bind(null, leadingMoves)}
                    onContextMenu={onContextMenu.bind(null, leadingMoves)}
                    color="inherit"
                    sx={{py: 0, m:0, textTransform: "none", lineHeight: "20px", minWidth: "0px"}}
                >
                    <MoveText text={formatFullMove(leadingMoves.at(-1)!, initialPly + leadingMoves.length)} />
                </Button>
                <NodeChildrenList
                    childNodes={childNodes}
                    leadingMoves={leadingMoves}
                    root={false}
                    initialPly={initialPly}
                    onClickMove={onClickMove}
                    onContextMenu={onContextMenu}
                    currentMoves={currentMoves}
                />
                <NodeConnectorLines branchCounts={[]} root={true} />
        </Stack>
    } else {
        content = <NodeChildrenList
            childNodes={childNodes}
            leadingMoves={leadingMoves}
            root={true}
            initialPly={initialPly}
            onClickMove={onClickMove}
            onContextMenu={onContextMenu}
            currentMoves={currentMoves}
        />
    }
    return <Box sx={sx}>
        <Paper sx={{ px: 1, py: 0.5 }}>
            <Stack direction="row" spacing={1} pb={0.5}>
                <MenuBook />
                <Typography variant="body2" pt={0.5}>Saved lines</Typography>
            </Stack>
            <Box sx={{pl: 2}}>{content}</Box>
        </Paper>
    </Box>
}

interface NodeChildrenListProps {
    childNodes: ViewNode[];
    leadingMoves: string[];
    root: boolean;
    initialPly?: number;
    onClickMove: (moves: string[]) => void;
    onContextMenu: (moves: Move[], event: React.MouseEvent<HTMLElement>) => void;
    currentMoves: Move[];
}

const NodeChildrenList: React.FC<NodeChildrenListProps> = ({childNodes, leadingMoves, root, initialPly, onClickMove, onContextMenu, currentMoves}) => {
    return <Stack position="relative">
        {
            childNodes.map(childNode => {
                const moves = [...leadingMoves, childNode.move]
                const moveText = (root) ? formatFullMove(childNode.move, (initialPly ?? 0) + leadingMoves.length) : childNode.move
                if (childNode.children === undefined) {
                    // Truncated node, display a line count and no children
                    const moveTextWithLineCount = `${moveText} (${childNode.lineCount})`
                    return <Link
                        href="#"
                        onClick={onClickMove.bind(null, moves)}
                        onContextMenu={onContextMenu.bind(null, moves)}
                        color="inherit"
                        underline="hover"
                    >
                        <MoveText text={moveTextWithLineCount} />
                    </Link>
                } else {
                    // Expanded node, display a list of children to the right of the move
                    return <Stack direction="row" alignItems="flex-start" key={childNode.move}>
                        <Button
                            onClick={onClickMove.bind(null, moves)}
                            onContextMenu={onContextMenu.bind(null, moves)}
                            color="inherit"
                            sx={{py: 0, m:0, textTransform: "none", lineHeight: "20px", minWidth: "0px"}}
                        >
                            <MoveText text={moveWithNags(moveText, childNode.nags)} current={movesEqual(moves, currentMoves)} />
                        </Button>
                        <NodeChildrenList
                            childNodes={Object.values(childNode.children)}
                            leadingMoves={moves}
                            root={false}
                            onClickMove={onClickMove}
                            onContextMenu={onContextMenu}
                            currentMoves={currentMoves}
                        />
                    </Stack>
                }
            })
        }
        <NodeConnectorLines branchCounts={childNodes.slice(0, -1).map(child => child.branchCount)} root={root} />
    </Stack>
}

function moveWithNags(moveText: string, nags: Nag[]): string {
    return [moveText, ...nags.map(nagText)].join("")
}

function movesEqual(moves1: Move[], moves2: Move[]): boolean {
    if (moves1.length !== moves2.length) {
        return false
    }
    return moves1.every((value, index) => value === moves2[index])
}

interface MoveProps {
    text: string,
    current?: boolean,
}

const MoveText: React.FC<MoveProps> = ({text, current}) => {
    return <Typography variant="body2" lineHeight="20px" color={(current === true)? "primary" : "inherit"}>{ text }</Typography>
}

interface NodeConnectorLinesProps {
    branchCounts: number[];
    root: boolean;
}
const NodeConnectorLines: React.FC<NodeConnectorLinesProps> = ({branchCounts, root}) => {
    if (branchCounts.length === 0 && !root) {
        return <Fragment />
    }

    let totalHeight = 0
    const textLineHeight = 20 // make sure this matches the line-height of the MoveText font
    // the lines from the root node are less wide and slightly taller
    let top = root ? "-4px" : "20px"
    let width = root ? 8 : 16

    const pathElements = ["M0,0"]
    if (root) {
        // For the root element, draw an extra line connecting the book icon
        pathElements.push(`v14`)
        pathElements.push(`h${width}`)
        pathElements.push(`m-${width},0`)
        totalHeight += 14
    }

    branchCounts.forEach((lineCount, i) => {
        let lineHeight = lineCount * textLineHeight
        // The first line doesn't need so much height
        if (i === 0 && !root) {
            lineHeight -= 10
        }
        pathElements.push(`v${lineHeight}`)
        pathElements.push(`h${width}`)
        pathElements.push(`m-${width},0`)
        totalHeight += lineHeight
    })
    const sx={
        position: "absolute",
        width: "{width}px",
        left: `-${width + 4}px`,
        top: top,
        height: `${totalHeight}px`
    }
    return <Box sx={sx}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{position: "absolute"}}
            fill="none"
            strokeWidth="1px"
            stroke="currentColor"
            viewBox={`0 0 ${width} ${totalHeight}`}
            width={width}
            height={totalHeight}
        >
          <path d={ pathElements.join(" ") }/>
        </svg>
    </Box>
}

interface VariationListProps {
    initialPly: number;
    rootNode: Node;
    moves: string[];
    dispatch: React.Dispatch<EditorReducer.Action>;
    sx?: SxProps<Theme>;
}

const VariationList: React.FC<VariationListProps> = ({initialPly, rootNode, moves, dispatch, sx}) => {
    const [menuState, setMenuState] = useState<[HTMLElement, Node, Move[]]|null>(null);
    const onContextMenu = useCallback((moves: Move[], event: React.MouseEvent<HTMLElement>) => {
        const node = getDescendant(rootNode, moves)
        if(node) {
            setMenuState([event.currentTarget, node, moves])
        }
        event.preventDefault()
    }, [rootNode])

    if (childCount(rootNode) === 0) {
        return <Box />
    }
    const tree = viewNodeTree({
        rootNode,
        moves,
        maxDepth: MAX_DEPTH,
        maxBranches: MAX_BRANCHES,
    })

    return <Fragment>
        <NodeTree
            leadingMoves={tree.leadingMoves}
            childNodes={tree.childNodes}
            initialPly={initialPly}
            onClickMove={moves => dispatch({type: 'set-moves', moves})}
            onContextMenu={onContextMenu}
            currentMoves={moves}
            sx={sx}
        />
        { menuState
            ? <LineMenu
                menuAnchor={menuState[0]}
                currentNode={menuState[1]}
                dispatch={(action: EditorReducer.Action) => {
                    dispatch({type: 'set-moves', moves: menuState[2]})
                    dispatch(action)
                }}
                onClose={() => setMenuState(null)}
            />
            : null
        }
    </Fragment>
}

export default VariationList
