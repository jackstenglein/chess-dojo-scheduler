import { User } from '@/database/user';
import { useTimeline } from '@/profile/activity/useTimeline';
import { useWindowSizeEffect } from '@/style/useWindowSizeEffect';
import { Close } from '@mui/icons-material';
import { Card, CardContent, Dialog, DialogContent, IconButton } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Heatmap } from './Heatmap';

const BLOCK_COLUMNS = 53;
const BLOCK_MARGIN = 4;
const DIALOG_PADDING = 124;
const LABEL_WIDTH = 30;
const MIN_BLOCK_SIZE = 12;

function getBlockSize() {
    const parentWidth = document
        .getElementsByTagName('html')[0]
        ?.getBoundingClientRect().width;
    if (!parentWidth) {
        return MIN_BLOCK_SIZE;
    }

    let newBlockSize =
        parentWidth - DIALOG_PADDING - (BLOCK_COLUMNS - 1) * BLOCK_MARGIN - LABEL_WIDTH;
    newBlockSize = newBlockSize / BLOCK_COLUMNS;

    return Math.max(MIN_BLOCK_SIZE, newBlockSize);
}

/**
 * Renders a card showing the user's activity heatmap.
 * @param user The user whose activity will be displayed in the heatmap.
 */
export const HeatmapCard = ({ user }: { user: User }) => {
    const { entries } = useTimeline(user.username);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [blockSize, setBlockSize] = useState(MIN_BLOCK_SIZE);

    const resizeDialogBlocks = useCallback(() => {
        if (isModalOpen) {
            setBlockSize(getBlockSize());
        }
    }, [isModalOpen, setBlockSize]);

    useEffect(resizeDialogBlocks, [resizeDialogBlocks]);
    useWindowSizeEffect(resizeDialogBlocks);

    return (
        <>
            <Card>
                <CardContent sx={{ position: 'relative' }}>
                    <Heatmap entries={entries} onPopOut={() => setIsModalOpen(true)} />
                </CardContent>
            </Card>

            <Dialog
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                maxWidth={false}
                fullWidth
                PaperProps={{
                    elevation: 1,
                }}
            >
                <IconButton
                    aria-label='close'
                    onClick={() => setIsModalOpen(false)}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <Close />
                </IconButton>

                <DialogContent
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Heatmap entries={entries} blockSize={blockSize} />
                </DialogContent>
            </Dialog>
        </>
    );
};
