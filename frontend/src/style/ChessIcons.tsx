import {
    faChessKing,
    faChessPawn,
    faChessQueen,
    faChessRook,
    faFish,
} from '@fortawesome/free-solid-svg-icons';
import { SvgIconProps } from '@mui/material';
import { forwardRef } from 'react';
import { FontAwesomeSvgIcon } from './Icon';

export function RookIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessRook} {...props} />;
}

export function QueenIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessQueen} {...props} />;
}

export function KingIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessKing} {...props} />;
}

export const PawnIcon = forwardRef<SVGSVGElement, SvgIconProps>(function PawnIcon(
    props: SvgIconProps,
    ref,
) {
    return <FontAwesomeSvgIcon ref={ref} icon={faChessPawn} {...props} />;
});

export const StockfishIcon = forwardRef<SVGSVGElement, SvgIconProps>(function StockfishIcon(
    props: SvgIconProps,
    ref,
) {
    return <FontAwesomeSvgIcon ref={ref} icon={faFish} {...props} />;
});
