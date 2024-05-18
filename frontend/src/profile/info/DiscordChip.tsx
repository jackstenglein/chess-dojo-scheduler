import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Chip, SvgIcon, SvgIconProps, Tooltip } from '@mui/material';
import { forwardRef } from 'react';

type FontAwesomeSvgIconProps = SvgIconProps & {
    icon: any;
};

export const FontAwesomeSvgIcon = forwardRef<SVGSVGElement, FontAwesomeSvgIconProps>(
    (props, ref) => {
        const { icon, ...others } = props;

        const {
            icon: [width, height, , , svgPathData],
        } = icon;

        return (
            <SvgIcon
                ref={ref}
                viewBox={`0 0 ${width} ${height}`}
                fontSize='small'
                className='MuiChip-icon'
                {...others}
            >
                {typeof svgPathData === 'string' ? (
                    <path d={svgPathData} />
                ) : (
                    /**
                     * A multi-path Font Awesome icon seems to imply a duotune icon. The 0th path seems to
                     * be the faded element (referred to as the "secondary" path in the Font Awesome docs)
                     * of a duotone icon. 40% is the default opacity.
                     *
                     * @see https://fontawesome.com/how-to-use/on-the-web/styling/duotone-icons#changing-opacity
                     */
                    svgPathData.map((d: string, i: number) => (
                        <path style={{ opacity: i === 0 ? 0.4 : 1 }} d={d} />
                    ))
                )}
            </SvgIcon>
        );
    },
);

export function DiscordIcon() {
    return <FontAwesomeSvgIcon icon={faDiscord} />;
}

interface DiscordChipProps {
    username?: string;
}

const DiscordChip: React.FC<DiscordChipProps> = ({ username }) => {
    if (!username) {
        return null;
    }

    return (
        <Tooltip title="The user's Discord username">
            <Chip
                icon={<DiscordIcon />}
                label={username}
                variant='outlined'
                color='primary'
            />
        </Tooltip>
    );
};

export default DiscordChip;
