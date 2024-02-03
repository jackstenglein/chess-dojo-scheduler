import { Tooltip as MuiTooltip, TooltipProps, tooltipClasses } from '@mui/material';
import { styled } from '@mui/material/styles';

export const cohortIcons: Record<string, string> = {
    '0-300': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_0-300.png',
    '300-400': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_300-400.png',
    '400-500': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_400-500.png',
    '500-600': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_500-600.png',
    '600-700': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_600-700.png',
    '700-800': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_700-800.png',
    '800-900': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_800-900.png',
    '900-1000': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_900-1000.png',
    '1000-1100':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1000-1100.png',
    '1100-1200':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1100-1200.png',
    '1200-1300':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1200-1300.png',
    '1300-1400':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1300-1400.png',
    '1400-1500':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1400-1500.png',
    '1500-1600':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1500-1600.png',
    '1600-1700':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1600-1700.png',
    '1700-1800':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1700-1800.png',
    '1800-1900':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1800-1900.png',
    '1900-2000':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_1900-2000.png',
    '2000-2100':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_2000-2100.png',
    '2100-2200':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_2100-2200.png',
    '2200-2300':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_2200-2300.png',
    '2300-2400':
        'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_2300-2400.png',
    '2400+': 'https://chess-dojo-images.s3.amazonaws.com/icons/v2/cohort_2400%2B.png',
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
}

const GraduationIcon: React.FC<GraduationIconProps> = ({ cohort, size = 40, sx }) => {
    if (!cohort) {
        return null;
    }

    const url = cohortIcons[cohort];
    if (!url) {
        return null;
    }

    return (
        <Tooltip title={`Graduated from ${cohort}`}>
            <img
                data-cy='graduation-icon'
                src={url}
                alt=''
                width={size}
                height={size}
                style={sx}
            />
        </Tooltip>
    );
};

export default GraduationIcon;
