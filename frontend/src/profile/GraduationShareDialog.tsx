import { EventType, trackEvent } from '@/analytics/events';
import GraduationCard from '@/components/graduations/GraduationCard';
import { Graduation } from '@/database/graduation';
import LoadingPage from '@/loading/LoadingPage';
import { LoadingButton } from '@mui/lab';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
} from '@mui/material';
import { domToPng } from 'modern-screenshot';
import { ForwardedRef, forwardRef, useEffect, useRef, useState } from 'react';

interface GraduationShareDialogProps {
    open: boolean;
    onClose: () => void;
    graduation: Graduation;
}

export default function GraduationShareDialog({
    open,
    onClose,
    graduation,
}: GraduationShareDialogProps) {
    const { newCohort } = graduation;
    const reportRef = useRef<HTMLDivElement>(null);
    const [imageData, setImageData] = useState<string>();

    const renderImage = () => {
        const node = reportRef.current;
        if (!node) {
            return;
        }

        // There are potentials CORS issues with AWS
        // https://github.com/bubkoo/html-to-image/issues/40
        // https://stackoverflow.com/questions/42263223/how-do-i-handle-cors-with-html2canvas-and-aws-s3-images
        // https://www.hacksoft.io/blog/handle-images-cors-error-in-chrome
        domToPng(node, {
            debug: true,
            fetch: {
                bypassingCache: true,
            },
            quality: 1,
            scale: 2,
            backgroundColor: '#121212',
        })
            .then((dataUrl) => {
                setImageData(dataUrl);
            })
            .catch((error) => {
                console.error('domToPng: ', error);
            });
    };

    useEffect(() => {
        renderImage();
    });

    const onDownload = (closeAfter: boolean) => {
        if (!imageData) {
            return;
        }
        trackEvent(EventType.DownloadGradBox, {
            previous_cohort: graduation.previousCohort,
            new_cohort: graduation.newCohort,
            dojo_score: graduation.score,
            graduated_at: graduation.createdAt,
        });

        const link = document.createElement('a');
        link.href = imageData;
        link.download = `graduation-${newCohort}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (closeAfter) {
            onClose();
        }
    };

    return (
        <Dialog maxWidth='md' open={open} onClose={onClose} fullWidth>
            <DialogTitle>Share your progress!</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <DialogContentText>
                        Show off your hard work and welcome the world to the Dojo!
                        Download this image and share on social media.
                    </DialogContentText>
                    <Stack
                        display='grid'
                        gridTemplateRows='auto 1fr'
                        alignItems='center'
                        justifyContent='center'
                    >
                        {imageData ? (
                            <img
                                onClick={() => onDownload(false)}
                                style={{ height: 'auto', maxWidth: '100%' }}
                                alt='dojo graduation badge'
                                src={imageData}
                            />
                        ) : (
                            <ReportCanvas ref={reportRef}>
                                <GraduationCard graduation={graduation} />
                            </ReportCanvas>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Close</Button>
                <LoadingButton loading={!imageData} onClick={() => onDownload(true)}>
                    Download
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

interface ReportCanvasProps {
    width?: number | string;
    height?: number | string;
    children: React.ReactElement;
}

const ReportCanvas = forwardRef(function ReportCanvas(
    { children }: ReportCanvasProps,
    ref: ForwardedRef<HTMLDivElement>,
) {
    return (
        <Box
            position='relative'
            overflow='hidden'
            sx={{ aspectRatio: '1.6/1' }}
            width='100%'
            height='auto'
        >
            <Box
                display='grid'
                height='100%'
                width='100%'
                bgcolor='background.default'
                position='absolute'
                zIndex={9}
            >
                <LoadingPage />
            </Box>
            <Box
                ref={ref}
                display='grid'
                zIndex={8}
                sx={{
                    width: '800px',
                    height: '540px',
                }}
            >
                {children}
            </Box>
        </Box>
    );
});
