import { Node, EndgameBook, EndgamePosition, calcNodeInfo } from "@bendk/chess-tree"
import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Editor from './Editor'
import EndgamePositionSelector from './EndgamePositionSelector'
import { updateBook } from "../../api/bookApi"

export interface EndgameEditorProps {
    book: EndgameBook;
}

const EndgameEditor: React.FC<EndgameEditorProps> = ({book}) => {
    const navigate = useNavigate()
    const [positions, setPositions] = useState<EndgamePosition[]>(book.positions)
    const [currentPosition, setCurrentPosition] = useState<EndgamePosition|null>(null)


    const updatePositions = useCallback((newPositions: EndgamePosition[]) => {
        const initialLineCount = book.positions.reduce(
            (count, position) => count + calcNodeInfo(position.rootNode).lineCount,
            0)
        setPositions(newPositions)
        const lineCount = newPositions.reduce(
            (count, position) => count + calcNodeInfo(position.rootNode).lineCount,
            0)

        updateBook(
            'test-user',
            { ...book, lineCount, positions: newPositions },
            initialLineCount,
        )
    }, [book])


    const onCreatePosition = useCallback((position: EndgamePosition) => {
        console.log("on create position: ", position)
        updatePositions([...positions, position])
        console.log("set position: ", position)
        setCurrentPosition(position)
    }, [positions, updatePositions])

    const onDeletePosition = useCallback((position: EndgamePosition) => {
        updatePositions(positions.filter(p => p.id !== position.id))
    }, [positions, updatePositions])

    const onSavePosition = useCallback((rootNode: Node) => {
        if (currentPosition) {
            updatePositions(positions.map(p => {
                if (p.id === currentPosition.id) {
                    return {
                        ...currentPosition,
                        rootNode: rootNode
                    }
                } else {
                    return p
                }
            }))
            setCurrentPosition(null)
        }
    }, [positions, updatePositions, currentPosition])

    const onDiscardPosition = useCallback(() => {
        setCurrentPosition(null)
    }, [setCurrentPosition])

    if (currentPosition === null) {
        return <EndgamePositionSelector
            positions={positions}
            onSelect={setCurrentPosition}
            onCreate={onCreatePosition}
            onDelete={onDeletePosition}
            onExit={() => navigate("/book/books")}
        />
    } else {
        return <Editor
            name={book.name}
            initialPosition={currentPosition.position}
            initialRootNode={currentPosition.rootNode}
            showDatabase={false}
            color={currentPosition.color}
            initialPly={(currentPosition.color === "w") ? 0 : 1}
            onDiscard={onDiscardPosition}
            onSave={onSavePosition}
        />
    }
}

export default EndgameEditor
