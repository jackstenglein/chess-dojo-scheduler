import { useRef, useEffect, useCallback } from 'react';
import { Move } from '@jackstenglein/chess';
import { Grid, Paper, Stack } from '@mui/material';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import MoveNumber from './MoveNumber';
import Ellipsis from './Ellipsis';
import MoveButton from './MoveButton';
import Interrupt, { hasInterrupt } from './Interrupt';

interface RowProps {
    data: Move[];
    index: number;
    style: any;
    scrollParent: HTMLDivElement | null;
    onClickMove: (m: Move) => void;
    setSize: (index: number, size: number) => void;
}

const Row: React.FC<RowProps> = ({
    data,
    index,
    style,
    scrollParent,
    onClickMove,
    setSize,
}) => {
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (rowRef.current) {
            setSize(index, rowRef.current.getBoundingClientRect().height);
        }
    }, [setSize, index]);

    const firstMoveIdx = 2 * index;
    const secondMoveIdx = 2 * index + 1;

    const firstMove = data[firstMoveIdx];
    const secondMove = data[secondMoveIdx];

    return (
        <div style={style}>
            <Stack ref={rowRef} direction='row' flexWrap='wrap' width={1}>
                <MoveNumber ply={firstMove.ply} />

                <MoveButton
                    move={firstMove}
                    scrollParent={scrollParent}
                    onClickMove={onClickMove}
                    firstMove={firstMove === data[0]}
                />

                {hasInterrupt(firstMove) && (
                    <>
                        <Interrupt
                            move={firstMove}
                            scrollParent={scrollParent}
                            onClickMove={onClickMove}
                        />

                        {secondMove && (
                            <>
                                <MoveNumber ply={secondMove.ply} />
                                <Ellipsis ply={secondMove.ply} />
                            </>
                        )}
                    </>
                )}

                {secondMove && (
                    <>
                        <MoveButton
                            move={secondMove}
                            scrollParent={scrollParent}
                            onClickMove={onClickMove}
                            firstMove={secondMove === data[0]}
                        />

                        {hasInterrupt(secondMove) && (
                            <>
                                <Interrupt
                                    move={secondMove}
                                    scrollParent={scrollParent}
                                    onClickMove={onClickMove}
                                />
                            </>
                        )}
                    </>
                )}
            </Stack>
        </div>
    );
};

interface VariationProps {
    moves: Move[];
    scrollParent: HTMLDivElement | null;
    onClickMove: (m: Move) => void;
}

const Variation: React.FC<VariationProps> = ({ moves, scrollParent, onClickMove }) => {
    const listRef = useRef<List>(null);

    const sizeMap = useRef<Record<number, number>>({});
    const setSize = useCallback((index: number, size: number) => {
        console.log('Setting size for index %d: %d', index, size);
        sizeMap.current = { ...sizeMap.current, [index]: size };
        if (listRef.current) {
            console.log('Resetting after index %d', index);
            listRef.current.resetAfterIndex(index);
        }
    }, []);
    const getSize = (index: number) => sizeMap.current[index] || 36.5;

    // const items: JSX.Element[] = [];

    // const rows: JSX.Element[] = [];

    // let needReminder = true;
    // for (let i = 0; i < moves.length; ) {
    //     let move = moves[i];
    //     let row: JSX.Element[] = [];

    //     if (move.ply % 2 === 1 || needReminder) {
    //     }
    // }

    // for (const move of moves) {
    //     if (move.ply % 2 === 1 || needReminder) {
    //         items.push(<MoveNumber key={`move-number-${move.ply}`} ply={move.ply} />);

    //         if (move.ply % 2 === 0) {
    //             items.push(<Ellipsis key={`ellipsis-${move.ply}`} ply={move.ply} />);
    //         }
    //     }
    //     needReminder = false;

    //     items.push(
    //         <MoveButton
    //             key={`move-button-${move.ply}`}
    //             move={move}
    //             scrollParent={scrollParent}
    //             onClickMove={onClickMove}
    //             firstMove={move === moves[0]}
    //         />
    //     );

    //     if (hasInterrupt(move)) {
    //         items.push(
    //             <Interrupt
    //                 key={`interrupt-${move.ply}`}
    //                 move={move}
    //                 scrollParent={scrollParent}
    //                 onClickMove={onClickMove}
    //             />
    //         );
    //         needReminder = true;
    //     }
    // }

    return (
        <Paper sx={{ flexGrow: 1, boxShadow: 'none' }}>
            {/* <Grid container>{items}</Grid> */}

            <AutoSizer disableWidth>
                {({ height }: { height: number }) => {
                    console.log('Autosizer height: ', height);

                    return (
                        <List
                            ref={listRef}
                            height={height}
                            width='100%'
                            itemData={moves}
                            itemSize={getSize}
                            itemCount={Math.ceil(moves.length / 2)}
                        >
                            {({ data, index, style }) => (
                                <Row
                                    data={data}
                                    index={index}
                                    style={style}
                                    setSize={setSize}
                                    scrollParent={scrollParent}
                                    onClickMove={onClickMove}
                                />
                            )}
                        </List>
                    );
                }}
            </AutoSizer>
        </Paper>
    );
};

export default Variation;
