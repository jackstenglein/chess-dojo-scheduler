import { faChessBoard } from '@fortawesome/free-solid-svg-icons';
import { SvgIconProps } from '@mui/material';
import { FontAwesomeSvgIcon } from '../profile/info/DiscordChip';

export default function BoardIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessBoard} {...props} />;
}
