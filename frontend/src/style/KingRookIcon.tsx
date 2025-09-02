import { faChess } from '@fortawesome/free-solid-svg-icons';
import { SvgIconProps } from '@mui/material';
import { FontAwesomeSvgIcon } from './Icon';

export default function KingRookIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faChess} {...props} />;
}
