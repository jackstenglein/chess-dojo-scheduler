import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { usePgnExportOptions } from '@/hooks/usePgnExportOptions';
import ScoreboardProgress from '@/scoreboard/ScoreboardProgress';
import { ExportDirectoryRun } from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Stack,
} from '@mui/material';
import { useEffect, useState } from 'react';

const MAX_RETRIES = 30;

export function DownloadGamesDialog({
    directories,
    games,
    onClose,
}: {
    directories?: { owner: string; id: string }[];
    games: { cohort: string; id: string }[];
    onClose: () => void;
}) {
    const {
        skipComments,
        setSkipComments,
        skipNags,
        setSkipNags,
        skipDrawables,
        setSkipDrawables,
        skipVariations,
        setSkipVariations,
        skipNullMoves,
        setSkipNullMoves,
        skipHeader,
        setSkipHeader,
        skipClocks,
        setSkipClocks,
    } = usePgnExportOptions();
    const api = useApi();
    const startRequest = useRequest<string>();
    const checkRequest = useRequest<ExportDirectoryRun>();
    const [recursive, setRecursive] = useState(true);
    const [delay, setDelay] = useState(1000);
    const [retries, setRetries] = useState(0);

    const { onSuccess, onFailure } = checkRequest;
    useEffect(() => {
        const id = startRequest.data;
        if (id && retries < MAX_RETRIES) {
            setTimeout(() => {
                api.checkDirectoryExport(id)
                    .then((response) => {
                        console.log('checkDirectoryExport: ', response);
                        onSuccess(response.data);
                        if (response.data.downloadUrl) {
                            window.open(response.data.downloadUrl, '_blank');
                        } else {
                            setDelay(Math.min(30000, delay * 1.3));
                            setRetries(retries + 1);
                        }
                    })
                    .catch((err) => {
                        console.error('checkDirectoryExport: ', err);
                        onFailure(err);
                        setDelay(Math.min(30000, delay * 1.3));
                        setRetries(retries + 1);
                    });
            }, delay);
        }
    }, [api, onFailure, startRequest.data, onSuccess, retries, setRetries, delay, setDelay]);

    const onDownload = async () => {
        try {
            startRequest.onStart();
            const response = await api.exportDirectory({
                directories,
                games: games.map((g) => ({ cohort: g.cohort, id: g.id })),
                recursive,
                options: {
                    skipComments,
                    skipNags,
                    skipDrawables,
                    skipVariations,
                    skipNullMoves,
                    skipHeader,
                    skipClocks,
                },
            });
            console.log('exportDirectory: ', response);
            startRequest.onSuccess(response.data.id);
        } catch (err) {
            console.error('exportDirectory: ', err);
            startRequest.onFailure(err);
        }
    };

    if (startRequest.data) {
        return (
            <Dialog open onClose={checkRequest.data?.downloadUrl ? onClose : undefined} fullWidth>
                <DialogTitle>Download PGN?</DialogTitle>
                {checkRequest.data?.downloadUrl ? (
                    <>
                        <DialogContent>
                            <DialogContentText>
                                Export completed for {checkRequest.data.total} games. If your
                                download did not start automatically, please click the download
                                button below.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button href={checkRequest.data.downloadUrl} target='_blank'>
                                Download
                            </Button>
                            <Button onClick={onClose}>Close</Button>
                        </DialogActions>
                    </>
                ) : (
                    <DialogContent>
                        <DialogContentText sx={{ mb: 1 }}>
                            Exporting PGN. For a large number of games, this may take a few
                            minutes...
                        </DialogContentText>
                        {checkRequest.data?.total ? (
                            <ScoreboardProgress
                                value={checkRequest.data.progress}
                                max={checkRequest.data.total}
                                min={0}
                                suffix='games'
                            />
                        ) : (
                            <Stack alignItems='center'>
                                <CircularProgress />
                            </Stack>
                        )}
                    </DialogContent>
                )}
                <RequestSnackbar request={checkRequest} />
            </Dialog>
        );
    }

    return (
        <Dialog open onClose={startRequest.isLoading() ? undefined : onClose} fullWidth>
            <DialogTitle>Download PGN?</DialogTitle>
            <DialogContent>
                {Boolean(directories?.length) && (
                    <Stack sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={recursive}
                                    onChange={(e) => setRecursive(e.target.checked)}
                                />
                            }
                            label='Include games from nested subfolders'
                        />
                    </Stack>
                )}

                <FormLabel>Options</FormLabel>
                <Stack direction='row' flexWrap='wrap' columnGap={1} mt={1}>
                    <FormGroup sx={{ flexGrow: 1, width: { xs: 1, sm: 'unset' } }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!skipComments}
                                    onChange={(e) => setSkipComments(!e.target.checked)}
                                />
                            }
                            label='Comments'
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!skipNags}
                                    onChange={(e) => setSkipNags(!e.target.checked)}
                                />
                            }
                            label='Glyphs (!, !?, etc)'
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!skipDrawables}
                                    onChange={(e) => setSkipDrawables(!e.target.checked)}
                                />
                            }
                            label='Arrows/Highlights'
                        />
                    </FormGroup>

                    <FormGroup sx={{ flexGrow: 1, width: { xs: 1, sm: 'unset' } }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!skipVariations}
                                    onChange={(e) => setSkipVariations(!e.target.checked)}
                                />
                            }
                            label='Variations'
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!skipNullMoves}
                                    onChange={(e) => setSkipNullMoves(!e.target.checked)}
                                />
                            }
                            label='Null Moves'
                        />
                    </FormGroup>

                    <FormGroup sx={{ flexGrow: 1, width: { xs: 1, sm: 'unset' } }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!skipHeader}
                                    onChange={(e) => setSkipHeader(!e.target.checked)}
                                />
                            }
                            label='Tags'
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!skipClocks}
                                    onChange={(e) => setSkipClocks(!e.target.checked)}
                                />
                            }
                            label='Clock Times'
                        />
                    </FormGroup>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button disabled={startRequest.isLoading()} onClick={onClose}>
                    Cancel
                </Button>
                <Button loading={startRequest.isLoading()} onClick={onDownload}>
                    Download
                </Button>
            </DialogActions>

            <RequestSnackbar request={startRequest} />
        </Dialog>
    );
}
