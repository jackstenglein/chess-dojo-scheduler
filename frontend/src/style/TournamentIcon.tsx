import { SvgIcon, SvgIconProps } from '@mui/material';

export function TournamentBracketIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props}>
            <svg
                stroke='currentColor'
                fill='none'
                strokeWidth='2'
                viewBox='0 0 24 24'
                strokeLinecap='round'
                strokeLinejoin='round'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path d='M4 4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'></path>
                <path d='M20 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'></path>
                <path d='M4 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'></path>
                <path d='M4 20m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'></path>
                <path d='M6 12h3a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-3'></path>
                <path d='M6 4h7a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-2'></path>
                <path d='M14 10h4'></path>
            </svg>
        </SvgIcon>
    );
}
