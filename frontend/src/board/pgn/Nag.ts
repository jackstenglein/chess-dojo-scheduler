export type Nag = string;

export interface NagDetails {
    label: string;
    description: string;
    color?: string;
    glyphY?: number;
    glyphFontSize?: string;
}

export const nags: Record<Nag, NagDetails> = {
    $1: {
        label: '!',
        description: 'Good move',
        color: '#21c43a',
    },
    $2: {
        label: '?',
        description: 'Mistake',
        color: '#e69d00',
    },
    $3: {
        label: '!!',
        description: 'Brilliant move',
        color: '#22ac38',
    },
    $4: {
        label: '??',
        description: 'Blunder',
        color: '#df5353',
        glyphFontSize: '4rem',
    },
    $5: {
        label: '!?',
        description: 'Interesting move',
        color: '#f075e1',
    },
    $6: {
        label: '?!',
        description: 'Dubious move',
        color: '#53b2ea',
    },
    $7: {
        label: '□',
        description: 'Only move',
        glyphY: 65,
    },
    $10: {
        label: '=',
        description: 'Equal position',
        glyphY: 65,
    },
    $11: {
        label: '=',
        description: 'Equal position',
    },
    $12: {
        label: '=',
        description: 'Equal position',
    },
    $13: {
        label: '∞',
        description: 'Unclear position',
    },
    $14: {
        label: '⩲',
        description: 'White is slightly better',
        glyphFontSize: '4rem',
        glyphY: 65,
    },
    $15: {
        label: '⩱',
        description: 'Black is slightly better',
        glyphFontSize: '4rem',
        glyphY: 65,
    },
    $16: {
        label: '±',
        description: 'White is better',
        glyphY: 65,
    },
    $17: {
        label: '∓',
        description: 'Black is better',
    },
    $18: {
        label: '+−',
        description: 'White is winning',
        glyphFontSize: '4rem',
        glyphY: 65,
    },
    $19: {
        label: '−+',
        description: 'Black is winning',
        glyphFontSize: '4rem',
        glyphY: 65,
    },
    $22: {
        label: '⨀',
        description: 'Zugzwang',
        glyphFontSize: '4rem',
        glyphY: 65,
    },
    $23: {
        label: '⨀',
        description: 'Zugzwang',
    },
    $26: {
        label: '○',
        description: 'Space advantage',
    },
    $27: {
        label: '○',
        description: 'Space advantage',
    },
    $32: {
        label: '⟳',
        description: 'Development advantage',
        glyphFontSize: '4rem',
        glyphY: 65,
    },
    $33: {
        label: '⟳',
        description: 'Development advantage',
    },
    $36: {
        label: '↑',
        description: 'Initiative',
        glyphFontSize: '4rem',
        glyphY: 65,
    },
    $37: {
        label: '↑',
        description: 'Initiative',
    },
    $40: {
        label: '→',
        description: 'Attack',
        glyphY: 65,
    },
    $41: {
        label: '→',
        description: 'Attack',
    },
    $44: {
        label: '=∞',
        description: 'Compensation',
        glyphFontSize: '4rem',
    },
    $45: {
        label: '=∞',
        description: 'Compensation',
    },
    $132: {
        label: '⇆',
        description: 'Counterplay',
        glyphY: 65,
    },
    $133: {
        label: '⇆',
        description: 'Counterplay',
    },
    $138: {
        label: '⨁',
        description: 'Time pressure',
        glyphFontSize: '4rem',
        glyphY: 65,
    },
    $139: {
        label: '⨁',
        description: 'Time pressure',
    },
    $140: {
        label: '∆',
        description: 'With the idea',
    },
    $146: {
        label: 'N',
        description: 'Novelty',
        glyphFontSize: '4rem',
    },
};

export function getStandardNag(nag: string): Nag {
    switch (nag) {
        case '$11':
            return '$10';
        case '$12':
            return '$10';
        case '$23':
            return '$22';
        case '$27':
            return '$26';
        case '$33':
            return '$32';
        case '$37':
            return '$36';
        case '$41':
            return '$40';
        case '$45':
            return '$44';
        case '$133':
            return '$132';
        case '$139':
            return '$138';
        case '$256':
            return '$13';

        default:
            return nag;
    }
}

export const badMoveNags: Nag[] = ['$6', '$2', '$4'];
export const goodMoveNags: Nag[] = ['$3', '$1', '$5'];

export const moveNags: Nag[] = ['$3', '$1', '$5', '$6', '$2', '$4', '$7', '$22'];
export const evalNags: Nag[] = ['$13', '$18', '$16', '$14', '$10', '$15', '$17', '$19'];
export const positionalNags: Nag[] = [
    '$146',
    '$32',
    '$36',
    '$40',
    '$132',
    '$138',
    '$44',
    '$140',
];

export function getNagInSet(nagSet: Nag[], nags: string[] | undefined): Nag {
    if (!nags) {
        return '';
    }

    for (const nag of nags) {
        let stdNag = getStandardNag(nag);
        if (nagSet.includes(stdNag)) {
            return stdNag;
        }
    }
    return '';
}

export function setNagInSet(nag: Nag | null, nagSet: Nag[], nags?: string[]): Nag[] {
    if (!nags) {
        if (nag) {
            return [nag];
        }
        return [];
    }

    nags = nags.filter((n) => !nagSet.includes(getStandardNag(n)));
    if (nag) {
        nags.push(nag);
    }
    return nags.sort(compareNags);
}

export function getNagsInSet(nagSet: Nag[], nags?: string[]): Nag[] {
    if (!nags) {
        return [];
    }
    return nags
        .map((n) => getStandardNag(n))
        .filter((n) => nagSet.includes(n))
        .sort(compareNags);
}

export function setNagsInSet(newNags: Nag[], nagSet: Nag[], nags?: string[]): Nag[] {
    if (!nags) {
        return newNags;
    }

    nags = nags.filter((n) => !nagSet.includes(getStandardNag(n)));
    nags.push(...newNags);
    return nags.sort(compareNags);
}

export function compareNags(lhs: Nag, rhs: Nag): number {
    let lhsNum = parseInt(lhs.slice(1));
    let rhsNum = parseInt(rhs.slice(1));

    if (lhsNum < rhsNum) {
        return -1;
    }
    return 1;
}

export function getNagGlyph(nag: NagDetails): string {
    return `
        <defs>
            <filter id="shadow">
                <feDropShadow dx="4" dy="7" stdDeviation="5" flood-opacity="0.5"></feDropShadow>
            </filter>
        </defs>
        <g transform="translate(71 -12) scale(0.4)">
            <circle style="fill:${nag.color || 'purple'};filter:url(#shadow)" cx="50" cy="50" r="50"></circle>
            <text
                font-size="${nag.glyphFontSize ?? '4.5rem'}" 
                font-weight="bold" 
                text-anchor="middle" 
                fill="white" 
                x="50" 
                y="${nag.glyphY ?? 75}"
            >
                ${nag.label}
            </text>
        </g>`;
}
