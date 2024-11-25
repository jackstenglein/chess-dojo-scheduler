import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { isGame } from '@/api/gameApi';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { useChess } from '@/board/pgn/PgnBoard';
import { getConfig } from '@/config';
import useGame from '@/context/useGame';
import { Chess } from '@jackstenglein/chess';
import { GameImportTypes } from '@jackstenglein/chess-dojo-common/src/database/game';
import { PdfExportRequest } from '@jackstenglein/chess-dojo-common/src/pgn/export';
import {
    Check,
    ContentPaste,
    Download,
    FolderOutlined,
    Link,
    OpenInNew,
    PictureAsPdf,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    CardContent,
    Checkbox,
    Divider,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Slider,
    Stack,
} from '@mui/material';
import axios from 'axios';
import copy from 'copy-to-clipboard';
import { ReactNode, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
    BoardStyle,
    BoardStyleKey,
    PieceStyle,
    PieceStyleKey,
} from '../settings/ViewerSettings';

const config = getConfig();

const pgnExportOptions = {
    skipComments: {
        key: 'export-pgn/skip-comments',
        default: false,
    },
    skipNags: {
        key: 'export-pgn/skip-nags',
        default: false,
    },
    skipDrawables: {
        key: 'export-pgn/skip-drawables',
        default: false,
    },
    skipVariations: {
        key: 'export-pgn/skip-variations',
        default: false,
    },
    skipNullMoves: {
        key: 'export-pgn/skip-null-moves',
        default: false,
    },
    skipHeader: {
        key: 'export-pgn/skip-header',
        default: false,
    },
    skipClocks: {
        key: 'export-pgn/skip-clocks',
        default: false,
    },
    plyBetweenDiagrams: {
        key: 'export-pgn/ply-between-diagrams',
        default: 20,
        min: 8,
        max: 40,
    },
} as const;

export function ShareTab() {
    const { chess, board } = useChess();
    const { game } = useGame();
    const [copied, setCopied] = useState('');
    const api = useApi();
    const { user } = useAuth();

    const [boardStyle] = useLocalStorage<string>(BoardStyleKey, BoardStyle.Standard);
    const [pieceStyle] = useLocalStorage<string>(PieceStyleKey, PieceStyle.Standard);

    const [skipComments, setSkipComments] = useLocalStorage<boolean>(
        pgnExportOptions.skipComments.key,
        pgnExportOptions.skipComments.default,
    );
    const [skipNags, setSkipNags] = useLocalStorage<boolean>(
        pgnExportOptions.skipNags.key,
        pgnExportOptions.skipNags.default,
    );
    const [skipDrawables, setSkipDrawables] = useLocalStorage<boolean>(
        pgnExportOptions.skipDrawables.key,
        pgnExportOptions.skipDrawables.default,
    );
    const [skipVariations, setSkipVariations] = useLocalStorage<boolean>(
        pgnExportOptions.skipVariations.key,
        pgnExportOptions.skipVariations.default,
    );
    const [skipNullMoves, setSkipNullMoves] = useLocalStorage<boolean>(
        pgnExportOptions.skipNullMoves.key,
        pgnExportOptions.skipNullMoves.default,
    );
    const [skipHeader, setSkipHeader] = useLocalStorage<boolean>(
        pgnExportOptions.skipHeader.key,
        pgnExportOptions.skipHeader.default,
    );
    const [skipClocks, setSkipClocks] = useLocalStorage<boolean>(
        pgnExportOptions.skipClocks.key,
        pgnExportOptions.skipClocks.default,
    );
    const [plyBetweenDiagrams, setPlyBetweenDiagrams] = useLocalStorage<number>(
        pgnExportOptions.plyBetweenDiagrams.key,
        pgnExportOptions.plyBetweenDiagrams.default,
    );

    const pdfRequest = useRequest();
    const cloneRequest = useRequest();

    const onCopy = (name: string, value: string) => {
        copy(value);
        setCopied(name);
        setTimeout(() => {
            setCopied('');
        }, 2500);
    };

    const onCopyUrl = () => {
        onCopy('url', window.location.href);
    };

    const onCopyFen = () => {
        onCopy('fen', chess?.fen() || '');
    };

    const onOpenBoardImage = () => {
        if (!chess) {
            return;
        }

        const fen = chess.fen();
        const newParams: Record<string, string> = {
            fen,
            orientation: board?.state.orientation || 'white',
            white: getPlayer(chess, 'White', 'WhiteElo'),
            black: getPlayer(chess, 'Black', 'BlackElo'),
            date: chess.header().getRawValue('Date'),
            lastMove: board?.state.lastMove?.join('') || '',
            comment: window.location.href,
            theme: boardStyle.toLowerCase(),
            piece:
                pieceStyle === PieceStyle.ThreeD ? 'standard' : pieceStyle.toLowerCase(),
        };
        if (!newParams.lastMove) {
            delete newParams.lastMove;
        }
        const params = new URLSearchParams(newParams);
        const url = `${config.api.baseUrl}/public/pgn-export/image?${params.toString()}`;
        window.open(url, '_blank');
    };

    const onDownloadGif = async () => {
        if (!chess) {
            return;
        }

        try {
            const white = getPlayer(chess, 'White', 'WhiteElo');
            const black = getPlayer(chess, 'Black', 'BlackElo');

            const response = await getPgnGif({
                white,
                black,
                date: chess.header().getRawValue('Date'),
                orientation: board?.state.orientation || 'white',
                comment: window.location.href,
                theme: boardStyle.toLowerCase(),
                piece:
                    pieceStyle === PieceStyle.ThreeD
                        ? 'standard'
                        : pieceStyle.toLowerCase(),
                delay: 100,
                frames: [{ fen: chess.setUpFen() }].concat(
                    chess.history().map((move) => ({
                        fen: move.after,
                        lastMove: `${move.from}${move.to}`,
                    })),
                ),
            });

            const a = document.createElement('a');
            a.download = `${white} - ${black}.gif`;
            a.href = window.URL.createObjectURL(response.data);
            a.dataset.downloadurl = ['application/octet-stream', a.download, a.href].join(
                ':',
            );
            a.click();
        } catch (err) {
            console.error('getPgnGif: ', err);
        }
    };

    const renderPgn = () => {
        return (
            chess?.renderPgn({
                skipComments,
                skipNags,
                skipDrawables,
                skipVariations,
                skipNullMoves,
                skipHeader,
                skipClocks,
            }) || ''
        );
    };

    const onCopyPgn = () => {
        onCopy('pgn', renderPgn());
    };

    const onDownloadPgn = () => {
        if (!chess) {
            return;
        }

        const pgn = renderPgn();
        const white = getPlayer(chess, 'White', 'WhiteElo');
        const black = getPlayer(chess, 'Black', 'BlackElo');

        const a = document.createElement('a');
        a.download = `${white} - ${black}.pgn`;
        a.setAttribute(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent(pgn),
        );
        a.click();
    };

    const onDownloadPdf = async () => {
        if (!chess) {
            return;
        }

        try {
            pdfRequest.onStart();
            const pgn = chess.renderPgn();

            const response = await getPdf({
                pgn,
                orientation: game?.orientation || board?.state.orientation || 'white',
                cohort: game?.cohort,
                id: game?.id,
                skipHeader,
                skipComments,
                skipNags,
                skipVariations,
                skipNullMoves,
                plyBetweenDiagrams,
            });

            const white = getPlayer(chess, 'White', 'WhiteElo');
            const black = getPlayer(chess, 'Black', 'BlackElo');

            const a = document.createElement('a');
            a.download = `${white} - ${black}.pdf`;
            a.href = window.URL.createObjectURL(response.data);
            a.dataset.downloadurl = ['application/octet-stream', a.download, a.href].join(
                ':',
            );
            a.click();

            pdfRequest.onSuccess();
        } catch (err) {
            console.error('exportPgnPdf: ', err);
            pdfRequest.onFailure(err);
        }
    };

    const onCloneGame = () => {
        if (!chess) {
            return;
        }

        cloneRequest.onStart();
        chess.setHeader('ClonedFrom', window.location.href);
        const pgn = renderPgn();
        chess.setHeader('ClonedFrom');

        api.createGame({ pgnText: pgn, type: GameImportTypes.clone })
            .then((resp) => {
                if (isGame(resp.data)) {
                    const urlSafeCohort = resp.data.cohort.replaceAll('+', '%2B');
                    window
                        .open(
                            `${config.baseUrl}/games/${urlSafeCohort}/${resp.data.id}`,
                            '_blank',
                        )
                        ?.focus();
                    trackEvent(EventType.SubmitGame, {
                        count: 1,
                        method: GameImportTypes.clone,
                    });
                }
                cloneRequest.onSuccess();
            })
            .catch((err) => {
                console.error('createGame: ', err);
                cloneRequest.onFailure(err);
            });
    };

    return (
        <CardContent>
            <Stack>
                <RequestSnackbar request={pdfRequest} />
                <RequestSnackbar request={cloneRequest} />

                <Stack
                    direction='row'
                    gap={1}
                    flexWrap='wrap'
                    mb={2}
                    justifyContent='center'
                >
                    <Button variant='contained' startIcon={<FolderOutlined />}>
                        Add to Folder
                    </Button>

                    <CopyButton
                        name='url'
                        startIcon={<Link />}
                        onClick={onCopyUrl}
                        copied={copied}
                    >
                        Copy URL
                    </CopyButton>

                    <CopyButton
                        name='fen'
                        startIcon={<ContentPaste />}
                        onClick={onCopyFen}
                        copied={copied}
                    >
                        Copy FEN
                    </CopyButton>

                    <Button
                        variant='contained'
                        startIcon={<OpenInNew />}
                        onClick={onOpenBoardImage}
                    >
                        Image
                    </Button>

                    <Button
                        variant='contained'
                        startIcon={<Download />}
                        onClick={onDownloadGif}
                    >
                        Gif
                    </Button>
                </Stack>

                <Divider />

                <Stack direction='row' flexWrap='wrap' columnGap={1} mt={2}>
                    <FormGroup>
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

                    <FormGroup>
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

                    <FormGroup>
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

                <FormGroup sx={{ mt: 1.5, mb: 1 }}>
                    <FormLabel>
                        {plyBetweenDiagrams / 2} Moves Between Diagrams (PDF Only)
                    </FormLabel>
                    <Slider
                        value={plyBetweenDiagrams}
                        onChange={(_, value) => setPlyBetweenDiagrams(value as number)}
                        step={2}
                        min={pgnExportOptions.plyBetweenDiagrams.min}
                        max={pgnExportOptions.plyBetweenDiagrams.max}
                        valueLabelFormat={(value) => {
                            return value / 2;
                        }}
                        valueLabelDisplay='auto'
                    />
                </FormGroup>

                <Stack
                    direction='row'
                    gap={1}
                    flexWrap='wrap'
                    mt={2}
                    justifyContent='center'
                >
                    <CopyButton
                        name='pgn'
                        startIcon={<ContentPaste />}
                        onClick={onCopyPgn}
                        copied={copied}
                    >
                        Copy PGN
                    </CopyButton>

                    <Button
                        variant='contained'
                        startIcon={<Download />}
                        onClick={onDownloadPgn}
                    >
                        Download PGN
                    </Button>

                    <LoadingButton
                        variant='contained'
                        startIcon={<PictureAsPdf />}
                        onClick={onDownloadPdf}
                        loading={pdfRequest.isLoading()}
                    >
                        Download PDF
                    </LoadingButton>

                    {user && (
                        <LoadingButton
                            variant='contained'
                            loading={cloneRequest.isLoading()}
                            onClick={onCloneGame}
                        >
                            Clone Game
                        </LoadingButton>
                    )}
                </Stack>
            </Stack>
        </CardContent>
    );
}

function CopyButton({
    name,
    children,
    startIcon,
    onClick,
    copied,
}: {
    name: string;
    children: ReactNode;
    startIcon: ReactNode;
    onClick: () => void;
    copied: string;
}) {
    return (
        <Button
            variant='contained'
            startIcon={copied === name ? <Check /> : startIcon}
            onClick={onClick}
        >
            {children}
        </Button>
    );
}

function getPlayer(
    chess: Chess,
    key: 'White' | 'Black',
    eloKey: 'WhiteElo' | 'BlackElo',
): string {
    const player = chess.header().getRawValue(key);
    const elo = chess.header().getRawValue(eloKey);
    if (player) {
        let result = player;
        if (elo) {
            result += ` (${elo})`;
        }
        return result;
    }
    return '';
}

interface PgnGifProps {
    white?: string;
    black?: string;
    date?: string;
    comment?: string;
    orientation?: 'white' | 'black';
    theme?: string;
    piece?: string;
    delay?: number;
    frames: {
        fen: string;
        delay?: number;
        lastMove?: string;
        check?: string;
    }[];
}

/**
 * Sends an API request to fetch the gif data for the given props.
 * @param props The request to get the gif.
 * @returns The gif data as a blob.
 */
function getPgnGif(props: PgnGifProps) {
    return axios.post<Blob>(`${config.api.baseUrl}/public/pgn-export/gif`, props, {
        responseType: 'blob',
    });
}

function getPdf(request: PdfExportRequest) {
    return axios.post<Blob>(`${config.api.baseUrl}/public/pgn-export/pdf`, request, {
        responseType: 'blob',
    });
}
