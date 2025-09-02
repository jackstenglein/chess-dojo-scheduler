export const incorrectMoveGlyphHtml = `
<defs>
    <filter id="shadow">
        <feDropShadow dx="4" dy="7" stdDeviation="5" flood-opacity="0.5"></feDropShadow>
    </filter>
</defs>
<g transform="translate(71 -12) scale(0.4)">
    <circle style="fill:var(--mui-palette-error-dark);filter:url(#shadow)" cx="50" cy="50" r="50"></circle>
</g>
<g transform="translate(79 -4)" fill="white">
    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
</g>
`;

export const correctMoveGlyphHtml = `
<defs>
    <filter id="shadow">
        <feDropShadow dx="4" dy="7" stdDeviation="5" flood-opacity="0.5"></feDropShadow>
    </filter>
</defs>
<g transform="translate(71 -12) scale(0.4)">
    <circle style="fill:var(--mui-palette-success-dark);filter:url(#shadow)" cx="50" cy="50" r="50"></circle>
</g>
<g transform="translate(79 -4)" fill="white">
    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
</g>
`;
