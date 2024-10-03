import { faChessBoard } from '@fortawesome/free-solid-svg-icons';
import { SvgIconProps } from '@mui/material';
import { FontAwesomeSvgIcon } from './Icon';

export default function BoardIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChessBoard} {...props} />;
}
