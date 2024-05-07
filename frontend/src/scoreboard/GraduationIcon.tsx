import { Tooltip as MuiTooltip, TooltipProps, tooltipClasses } from '@mui/material';
import { styled } from '@mui/material/styles';

export const cohortIcons: Record<string, string> = {
    '0-300': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/0-300.png',
    '300-400': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/300-400.png',
    '400-500': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/400-500.png',
    '500-600': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/500-600.png',
    '600-700': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/600-700.png',
    '700-800': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/700-800.png',
    '800-900': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/800-900.png',
    '900-1000': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/900-1000.png',
    '1000-1100': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1000-1100.png',
    '1100-1200': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1100-1200.png',
    '1200-1300': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1200-1300.png',
    '1300-1400': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1300-1400.png',
    '1400-1500': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1400-1500.png',
    '1500-1600': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1500-1600.png',
    '1600-1700': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1600-1700.png',
    '1700-1800': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1700-1800.png',
    '1800-1900': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1800-1900.png',
    '1900-2000': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/1900-2000.png',
    '2000-2100': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/2000-2100.png',
    '2100-2200': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/2100-2200.png',
    '2200-2300': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/2200-2300.png',
    '2300-2400': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/2300-2400.png',
    '2400+': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/2300-2400.png',
    // '2500+': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/2300-2400.png',
    // '2600+': 'https://chess-dojo-images.s3.amazonaws.com/icons/v3/2300-2400.png',
     
};

const Tooltip = styled(({ className, ...props }: TooltipProps) => (
    <MuiTooltip {...props} arrow classes={{ popper: className }} />
))(() => ({
    [`& .${tooltipClasses.tooltip}`]: {
        zIndex: 1301,
    },
}));

interface GraduationIconProps {
    cohort?: string;
    size?: number;
    sx?: React.CSSProperties;
    title?: string;
}

const GraduationIcon: React.FC<GraduationIconProps> = ({ cohort, size = 40, sx, title}) => {
    if (!cohort) {
        return null;
    }

    const url = cohortIcons[cohort];
    if (!url) {
        return null;
    }

    //`Graduated from ${cohort}`
    return (
        <Tooltip title={title}>
            <img
                data-cy='graduation-icon'
                src={url}
                alt=''
                width={size}
                height={size}
                style={{
                    ...sx,
                    ...(cohort === '2300-2400'
                        ? { filter: `drop-shadow(0px 0px ${size / 8}px silver)` }
                        : {}),
                    ... (cohort === '2400+' // pick from silver, blue, purple or this #25ffee or red or #25ff2c
                        ? { filter: `drop-shadow(0px 0px ${size / 8}px #fedf53` }
                        : {}),
                    // ...(cohort === '2500+'
                    //     ? { filter: `drop-shadow(0px 0px ${size / 8}px blue)` }
                    //     : {}),
                    // ... (cohort === '2600+' // pick from silver, blue, purple or this #25ffee or red or #25ff2c
                    //     ? { filter: `drop-shadow(0px 0px ${size / 8}px purple` }
                    //     : {}),           
                }}
            />
        </Tooltip>
    );
};

export default GraduationIcon;