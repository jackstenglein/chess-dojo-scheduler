import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { usePgnExportOptions } from '@/hooks/usePgnExportOptions';
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Stack,
} from '@mui/material';
import { useState } from 'react';

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
    const request = useRequest();
    const [recursive, setRecursive] = useState(true);

    const onDownload = async () => {
        try {
            request.onStart();
            const response = await api.exportDirectory({
                directories,
                games: games.map((g) => ({ cohort: g.cohort, id: g.id })),
                recursive,
            });
            console.log('exportDirectory: ', response);
        } catch (err) {
            console.error('exportDirectory: ', err);
            request.onFailure(err);
        }
    };

    return (
        <Dialog open onClose={onClose} fullWidth>
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
                <Button disabled={request.isLoading()} onClick={onClose}>
                    Cancel
                </Button>
                <Button loading={request.isLoading()} onClick={onDownload}>
                    Download
                </Button>
            </DialogActions>

            <RequestSnackbar request={request} />
        </Dialog>
    );
}
