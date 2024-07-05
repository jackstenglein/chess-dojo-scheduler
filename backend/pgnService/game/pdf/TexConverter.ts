import { Chess, Color, Move } from '@jackstenglein/chess';
import { compareNags, nags } from '@jackstenglein/chess-dojo-common/src/pgn/nag';
import qrcode from 'qrcode';
import { Game } from '../types';

export default class TexConverter {
    private chess: Chess;
    private game: Game;
    private tex: string;

    constructor(game: Game) {
        this.game = game;
        this.chess = new Chess({ pgn: game.pgn });
        this.tex = '';
    }

    /** Writes a QR code linking to the game to the temporary file qrcode.png. */
    writeQrCode() {
        const cohort = encodeURIComponent(this.game.cohort);
        const id = encodeURIComponent(this.game.id);
        qrcode.toFile('qrcode.png', `https://www.chessdojo.club/games/${cohort}/${id}`, {
            errorCorrectionLevel: 'H',
        });
    }

    /**
     * @returns The Tex content of the provided Game.
     */
    toTex(): string {
        if (this.tex) {
            return this.tex;
        }

        this.writeQrCode();

        this.makeTitle();

        if (this.chess.pgn.gameComment.comment) {
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
        this.tex = staticTexHeader;
        this.tex += `\n\\title{${this.chess.header().tags.White || 'NN'} - ${this.chess.header().tags.Black || 'NN'}}`;
        this.tex += `\n\\author{Notes by ${this.game.orientation.slice(0, 1).toUpperCase()}${this.game.orientation.slice(1)}}`;
        this.tex +=
            '\n\\begin{document}\n\\maketitle\n\\begin{multicols}{2}\n\\newchessgame\n\n';
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
     * @param index The index of the variation.
     */
    private beginVariation(depth: number, index: number) {
        if (!depth) {
            this.tex += `\\begin{tabbing}\n\\hspace{.2\\linewidth}\\=\\hspace{.2\\linewidth}\\=\\hspace{.2\\linewidth}\\= \\kill\n`;
            return;
        }

        this.tex += `\n\n`;
        if (index > 0) {
            this.tex += `\\medskip\n`;
        }
        if (depth > 1) {
            this.tex += `\\begin{adjustwidth}{.05\\linewidth}{}\n{\\itshape (`;
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
        this.beginVariation(depth, 0);
    }

    /**
     * Ends a variation with the given depth.
     * @param depth The depth of the variation.
     */
    private endVariation(depth: number) {
        if (!depth) {
            this.tex += '\\end{tabbing}\n';
            return;
        }

        if (depth > 1) {
            this.tex = this.tex.trimEnd();
            this.tex += `)}\n\\end{adjustwidth}\n`;
        }
    }

    /**
     * Adds the given comment to the output.
     * @param comment The comment to add.
     * @param depth The depth of the variation containing the comment.
     */
    private makeComment(comment: string, depth: number) {
        if (!depth) {
            this.tex += `\n\n${comment.replaceAll('#', '\\#').trim()}\n\n`;
        } else {
            this.tex += ` ${comment.replaceAll('#', '\\#').trim()} `;
        }
    }

    /**
     * Recursively adds the given variation to the output.
     * @param moves The variation to add.
     * @param depth The depth of the variation. The mainline is 0.
     */
    private makeVariation(moves: Move[], depth: number, index: number = 0) {
        this.beginVariation(depth, index);

        let forceMoveNumber = true;
        moves.forEach((move) => {
            if (move.commentMove) {
                this.pauseVariation(depth);
                this.makeComment(move.commentMove, depth);
                this.resumeVariation(depth);
                forceMoveNumber = true;
            }

            this.makeMoveNumber(move, depth, forceMoveNumber);
            this.makeMoveNotation(move, depth);
            forceMoveNumber = false;

            if (move.commentAfter || move.variations.length > 0) {
                this.pauseVariation(depth);
                forceMoveNumber = true;
            }

            if (move.commentAfter) {
                this.makeComment(move.commentAfter, depth);
            }

            move.variations.forEach((variation, index) =>
                this.makeVariation(variation, depth + 1, index),
            );

            if (forceMoveNumber) {
                this.resumeVariation(depth);
            }
        });

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
            this.tex += `\\\\\\>\\textbf{${moveNumber}}`;
        } else {
            this.tex += `${moveNumber}.~`;
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
            this.tex += `\\\\\\>\\textbf{${moveNumber}}`;
            this.tex += `\\>\\ldots`;
        } else {
            this.tex += `${moveNumber}\\ldots~`;
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
        const nagLabel = nagDetails.map((n) => n.label).join('');

        let nagColor = '';
        for (const nag of nagDetails) {
            if (nag.pdfColorName) {
                nagColor = nag.pdfColorName;
                break;
            }
        }

        if (nagColor) {
            this.tex += `\\color{${nagColor}}`;
        }

        if (!depth) {
            this.tex += `\\>\\textbf{${moveTex}${nagLabel}}\n`;
        } else {
            this.tex += `${moveTex}${nagLabel}`;
            if (move.next || move.commentAfter) {
                this.tex += `\\space `;
                if (move.color === Color.black && !move.commentAfter) {
                    this.tex += `\\space `;
                }
            }
        }

        if (nagColor) {
            this.tex += '\\color{black}';
        }
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

const staticTexHeader = String.raw`\documentclass{article}
\usepackage{xskak}
\usepackage{multicol}
\usepackage[a4paper]{geometry}
\usepackage{parskip}
\usepackage{changepage}
\usepackage[autostyle, english = american]{csquotes}
\usepackage[dvipsnames]{xcolor}
\usepackage[T1]{fontenc}
\usepackage{graphicx}
\usepackage[skip=0pt]{caption}
\usepackage{titling}

\definecolor{good}{HTML}{21c43a}
\definecolor{mistake}{HTML}{e69d00}
\definecolor{brilliant}{HTML}{22ac38}
\definecolor{blunder}{HTML}{df5353}
\definecolor{interesting}{HTML}{f075e1}
\definecolor{dubious}{HTML}{53b2ea}
\definecolor{eval}{HTML}{800080}
\MakeOuterQuote{"}

\geometry{left=1.25cm,right=1.25cm,top=1.5cm,bottom=1.5cm,columnsep=1.2cm}
\setlength{\parindent}{0pt}

\pretitle{%
  \begin{center}
  \Huge\bfseries
}
\posttitle{%
  \end{center}%
}
\preauthor{%
  \begin{center}
    \huge \lineskip 0.75em%
}
\postauthor{%
  \end{center}%
}

\renewcommand\maketitlehookd{
    \vspace{-20pt}
    \begin{figure}[h]
    \centering
    \includegraphics[scale=0.5]{qrcode.png}
    \caption*{View on ChessDojo.club}
    \end{figure}
}

\date{}`;
