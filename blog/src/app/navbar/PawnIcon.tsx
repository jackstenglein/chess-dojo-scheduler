import { faChessPawn } from '@fortawesome/free-solid-svg-icons';
import { SvgIcon } from '@mui/material';
import { forwardRef } from 'react';

type FontAwesomeSvgIconProps = {
    icon: any;
};

const FontAwesomeSvgIcon = forwardRef<SVGSVGElement, FontAwesomeSvgIconProps>(
    (props, ref) => {
        const { icon, ...others } = props;

        const {
            icon: [width, height, , , svgPathData],
        } = icon;

        return (
            <SvgIcon {...others} ref={ref} viewBox={`0 0 ${width} ${height}`}>
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
                        <path key={i} style={{ opacity: i === 0 ? 0.4 : 1 }} d={d} />
                    ))
                )}
            </SvgIcon>
        );
    },
);
FontAwesomeSvgIcon.displayName = 'FontAwesomeSvgIcon';

export default function PawnIcon(props: any) {
    return <FontAwesomeSvgIcon icon={faChessPawn} {...props} />;
}
