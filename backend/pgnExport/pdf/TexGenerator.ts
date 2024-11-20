import { Chess, Color, Move, nullMoveNotation } from '@jackstenglein/chess';
import { PdfExportRequest } from '@jackstenglein/chess-dojo-common/src/pgn/export';
import { compareNags, nags } from '@jackstenglein/chess-dojo-common/src/pgn/nag';
import { ApiError } from 'chess-dojo-directory-service/api';
import qrcode from 'qrcode';

interface TexGeneratorOptions extends PdfExportRequest {
    qrcodeFilename: string;
}

export class TexGenerator {
    private chess: Chess;
    private tex: string;
    private options: TexGeneratorOptions;
    private startPly: number;

    constructor(options: TexGeneratorOptions) {
        this.chess = new Chess({ pgn: options.pgn });
        this.startPly = (this.chess.firstMove()?.ply || 1) - 1;
        this.tex = '';
        this.options = options;
    }

    /**
     * Writes a QR code linking to the game to a temporary file. */
    async writeQrCode() {
        if (!this.options.cohort || !this.options.id) {
            throw new ApiError({
                statusCode: 500,
                publicMessage: 'Temporary server error',
                privateMessage: `TexGenerator.writeQrCode called, but options is missing cohort/id: ${this.options}`,
            });
        }

        const cohort = encodeURIComponent(this.options.cohort);
        const id = encodeURIComponent(this.options.id);

        await new Promise<void>((resolve, reject) => {
            qrcode.toFile(
                this.options.qrcodeFilename,
                `https://www.chessdojo.club/games/${cohort}/${id}`,
                {
                    errorCorrectionLevel: 'H',
                },
                function (err) {
                    if (err) reject(err);
                    resolve();
                },
            );
        });
    }

    /**
     * @returns The Tex content of the provided Game.
     */
    async toTex(): Promise<string> {
        if (this.tex) {
            return this.tex;
        }

        if (this.options.cohort && this.options.id) {
            await this.writeQrCode();
        }

        this.makeTitle();

        if (!this.options.skipComments && this.chess.pgn.gameComment.comment) {
            this.makeComment(this.chess.pgn.gameComment.comment, 0);
        }

        this.makeVariation(this.chess.history(), 0);
        this.makeResult();

        this.makeEnd();
        return this.tex;
    }

    /**
     * Adds the title and beginning of the document to the output.
     */
    private makeTitle() {
        if (this.tex) {
            throw new Error(`makeTitle called with existing texString ${this.tex}`);
        }

        this.tex = staticTexHeader(
            this.options.cohort && this.options.id ? this.options.qrcodeFilename : '',
        );

        const white = getPlayer(
            this.chess.header().tags.White,
            this.chess.header().tags.WhiteElo?.value,
        );
        const black = getPlayer(
            this.chess.header().tags.Black,
            this.chess.header().tags.BlackElo?.value,
        );

        this.tex += `\n\\title{${white} - ${black}}`;
        this.tex += `\n\\author{${this.chess.header().getRawValue('Date') || 'Unknown Date'}}`;
        this.tex += `\n\\date{Notes by ${this.options.orientation.slice(0, 1).toUpperCase()}${this.options.orientation.slice(1)}}`;
        this.tex += beginTexDocument(this.options.skipHeader);
    }

    /**
     * Adds the end of the document to the output.
     */
    private makeEnd() {
        this.tex += `\n\\end{multicols}\n\\end{document}\n`;
    }

    /**
     * Begins a variation with the given depth and index.
     * @param depth The depth of the variation. 0 indicates the mainline.
     */
    private beginVariation(depth: number) {
        this.tex += `\n\n`;
        if (depth > 1) {
            this.tex += `\\begin{variationInterrupt}\n`;
        }
    }

    /**
     * Pauses a variation with the given depth.
     * @param depth The depth of the variation.
     */
    private pauseVariation(depth: number) {
        if (depth) {
            return;
        }
        this.endVariation(depth);
    }

    /**
     * Resumes a variation with the given depth.
     * @param depth The depth of the variation.
     */
    private resumeVariation(depth: number) {
        if (depth) {
            return;
        }
        this.tex += '\\vspace{1em}';

        this.beginVariation(depth);
    }

    /**
     * Ends a variation with the given depth.
     * @param depth The depth of the variation.
     */
    private endVariation(depth: number) {
        if (depth > 1) {
            this.tex = this.tex.trimEnd();
            this.tex += `\n\\end{variationInterrupt}\n`;
        }
    }

    /**
     * Adds the given comment to the output.
     * @param comment The comment to add.
     * @param depth The depth of the variation containing the comment.
     */
    private makeComment(comment: string, depth: number) {
        if (!depth) {
            this.tex += `\n\n\\forceindent ${comment.replaceAll('#', '\\#').trim()}\n\n`;
        } else {
            this.tex += `\n\\begin{variationInterrupt}\n${comment.replaceAll('#', '\\#').trim()}\n\\end{variationInterrupt}\n\n`;
        }
    }

    /**
     * Recursively adds the given variation to the output.
     * @param moves The variation to add.
     * @param depth The depth of the variation. The mainline is 0.
     */
    private makeVariation(moves: Move[], depth: number) {
        this.beginVariation(depth);

        let forceMoveNumber = true;
        for (const move of moves) {
            if (this.options.skipNullMoves && move.san === nullMoveNotation) {
                break;
            }

            if (!this.options.skipComments && move.commentMove) {
                this.pauseVariation(depth);
                this.makeComment(move.commentMove, depth);
                this.resumeVariation(depth);
                forceMoveNumber = true;
            }

            this.makeMoveNumber(move, depth, forceMoveNumber);
            this.makeMoveNotation(move, depth);
            forceMoveNumber = false;

            const showDiagram =
                (move.ply - this.startPly) % this.options.plyBetweenDiagrams === 0 &&
                moves[0] !== move;

            if (
                (!this.options.skipComments && move.commentAfter) ||
                (!this.options.skipVariations && move.variations.length > 0) ||
                showDiagram
            ) {
                this.pauseVariation(depth);
                forceMoveNumber = true;
            }

            if (showDiagram) {
                this.makeDiagram(move);
            }

            if (!this.options.skipComments && move.commentAfter) {
                this.makeComment(move.commentAfter, depth);
            }

            if (!this.options.skipVariations) {
                move.variations.forEach((variation) =>
                    this.makeVariation(variation, depth + 1),
                );
            }

            if (forceMoveNumber) {
                this.resumeVariation(depth);
            }
        }

        this.endVariation(depth);
    }

    /**
     * Adds the number of the given move to the output if necessary. Black moves
     * are skipped unless showBlack is true.
     * @param move The move to add the number of.
     * @param depth The depth of the variation. The mainline is 0.
     * @param showBlack Whether to show the move number for black moves.
     */
    private makeMoveNumber(move: Move, depth: number, showBlack: boolean) {
        if (move.color === Color.white) {
            this.makeWhiteMoveNumber(move, depth);
        } else if (showBlack) {
            this.makeBlackMoveNumber(move, depth);
        }
    }

    /**
     * Adds the number of the given white move to the output.
     * @param move The move to add the number of.
     * @param depth The depth of the variation. The mainline is 0.
     */
    private makeWhiteMoveNumber(move: Move, depth: number) {
        const moveNumber = Math.floor(move.ply / 2) + 1;
        if (!depth) {
            this.tex += `\\textbf{${moveNumber}}.`;
        } else {
            this.tex += `${moveNumber}.`;
        }
    }

    /**
     * Adds the number of the given black move to the output.
     * @param move The move to add the number of.
     * @param depth The depth of the variation. The mainline is 0.
     */
    private makeBlackMoveNumber(move: Move, depth: number) {
        const moveNumber = move.ply / 2;
        if (!depth) {
            this.tex += `\\textbf{${moveNumber}}...`;
        } else {
            this.tex += `${moveNumber}...`;
        }
    }

    /**
     * Adds the move notation to the output.
     * @param move The move to add the notation of.
     * @param depth The depth of the variation. The mainline is 0.
     */
    private makeMoveNotation(move: Move, depth: number) {
        let moveTex = move.san
            .replaceAll('B', '\\figsymbol{B}')
            .replaceAll('N', '\\figsymbol{N}')
            .replaceAll('R', '\\figsymbol{R}')
            .replaceAll('Q', '\\figsymbol{Q}')
            .replaceAll('K', '\\figsymbol{K}')
            .replaceAll('#', '\\#');

        const nagDetails =
            move.nags
                ?.sort(compareNags)
                .map((n) => nags[n])
                .filter((n) => n) ?? [];
        const nagLabel = this.options.skipNags
            ? ''
            : nagDetails.map((n) => n.label).join('');

        if (!depth) {
            this.tex += `\\textbf{${moveTex}${nagLabel}}`;
        } else {
            this.tex += `${moveTex}${nagLabel}`;
        }

        if (move.next || move.commentAfter) {
            this.tex += `\\space `;
            if (move.color === Color.black && !move.commentAfter) {
                this.tex += `\\space `;
            }
        }
    }

    /**
     * Adds a diagram of the position after the move into the output.
     * @param move The move to add a diagram after.
     */
    private makeDiagram(move: Move) {
        this.tex += `\n\n\\begin{board}`;
        this.tex +=
            `\\chessboard[` +
            `${this.options.orientation === 'black' ? 'inverse,' : ''}` +
            `setfen=${move.fen},` +
            `colorbackfields={${move.from},${move.to}}`;

        if (!this.options.skipDrawables) {
            const arrowsByColor = move.commentDiag?.colorArrows?.reduce(
                (acc, arrow) => {
                    const color = arrow[0];
                    const squares = arrow.slice(1, 3) + '-' + arrow.slice(3);
                    acc[color] = (acc[color] || []).concat(squares);
                    return acc;
                },
                {} as Record<string, string[]>,
            );
            for (const color of Object.keys(arrowsByColor || {})) {
                this.tex += `,pgfstyle=straightmove,color=${boardColors[color]},markmoves={${arrowsByColor?.[color].join(',')}}`;
            }

            const squaresByColor = move.commentDiag?.colorFields?.reduce(
                (acc, field) => {
                    const color = field[0];
                    const square = field.slice(1);
                    acc[color] = (acc[color] || []).concat(square);
                    return acc;
                },
                {} as Record<string, string[]>,
            );
            for (const color of Object.keys(squaresByColor || {})) {
                this.tex += `,pgfstyle=circle,color=${boardColors[color]},markfields={${squaresByColor?.[color].join(',')}}`;
            }
        }

        this.tex += `]\\end{board}\n\n`;
    }

    /** Adds the result of the game to the output. */
    private makeResult() {
        let result = '';
        switch (this.chess.header().tags.Result) {
            case '1-0':
                result = '1-0 White Wins';
                break;
            case '0-1':
                result = '0-1 Black Wins';
                break;
            case '1/2-1/2':
                result = '1/2-1/2 Draw';
        }

        if (result) {
            this.tex += `\n\\begin{center} \\textbf{${result}} \\end{center}\n`;
        }
    }
}

function staticTexHeader(qrcodeFilename: string) {
    let result = String.raw`\documentclass{article}
\usepackage{xskak}
\usepackage{multicol}
\usepackage[a4paper]{geometry}
\usepackage[skip=0pt]{parskip}
\usepackage{changepage}
\usepackage[autostyle, english = american]{csquotes}
\usepackage[dvipsnames]{xcolor}
\usepackage[LSF,T1]{fontenc}
\usepackage{graphicx}
\usepackage[skip=0pt]{caption}
\usepackage{titling}
\usepackage{etoolbox}
\AtBeginEnvironment{variationInterrupt}{\partopsep2pt}

\newenvironment{board}
 {\parskip=0em\par\nopagebreak\centering}
 {\parskip=1em\par\noindent\ignorespacesafterend}

\graphicspath{{./}}

\newcommand{\forceindent}{\leavevmode{\parindent=1em\indent}}

\newenvironment{variationInterrupt}
{
    \begin{adjustwidth}{.05\linewidth}{}
}
{
    \end{adjustwidth}
}

\definecolor{good}{HTML}{21c43a}
\definecolor{mistake}{HTML}{e69d00}
\definecolor{brilliant}{HTML}{22ac38}
\definecolor{blunder}{HTML}{df5353}
\definecolor{interesting}{HTML}{f075e1}
\definecolor{dubious}{HTML}{53b2ea}
\definecolor{eval}{HTML}{800080}
\MakeOuterQuote{"}

\geometry{left=1.25cm,right=1.25cm,top=1.5cm,bottom=1.5cm,columnsep=1.2cm}

\pdfmapfile{+chess.map}
\setchessboard{boardfontfamily=merida}
\setfigfontfamily{merida}

\pretitle{%
  \begin{center}
  \Huge\bfseries
}
\posttitle{%
  \end{center}%
}
\predate{%
    \begin{center}
    \Large
}
\postdate{%
    \end{center}%
}
\preauthor{%
  \begin{center}
    \huge \lineskip 0.75em%
}
\postauthor{%
  \end{center}%
}

`;

    if (qrcodeFilename) {
        result += String.raw`\renewcommand\maketitlehookd{
\vspace{-15pt}
\begin{figure}[h]
\centering
\includegraphics[scale=0.5]{${qrcodeFilename}}
\caption*{View on ChessDojo.club}
\end{figure}
}

`;
    }

    return result;
}

function beginTexDocument(skipHeader?: boolean) {
    return String.raw`
\begin{document}
${skipHeader ? '' : '\\maketitle'}
\begin{multicols}{2}

\storechessboardstyle{diagram}{%
    pgfstyle=color,
    color=yellow!40,
    moversize=0.75em
}
\setchessboard{style=diagram}

`;
}

function getPlayer(name: string | undefined, elo: string | undefined): string {
    let result = name || 'NN';
    if (elo) {
        return `${result} (${elo})`;
    }
    return result;
}

const boardColors: Record<string, string> = {
    Y: 'Dandelion',
    R: 'red',
    B: 'cyan',
    G: 'Green',
    O: 'orange',
    C: 'magenta',
};
