import {
    faChessKing,
    faChessPawn,
    faChessQueen,
    faChessRook,

} from '@fortawesome/free-solid-svg-icons';
import { SvgIconProps } from '@mui/material';
import { FontAwesomeSvgIcon } from '../profile/info/DiscordChip';

export function RookIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessRook} {...props} />;
}


export function QueenIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessQueen} {...props} />;
}

export function KingIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessKing} {...props} />;
}

export function PawnIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessPawn} {...props} />;
}
