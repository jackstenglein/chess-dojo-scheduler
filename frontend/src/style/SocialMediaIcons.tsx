import { faDiscord, faTwitch, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { SvgIconProps } from '@mui/material';
import { FontAwesomeSvgIcon } from '../profile/info/DiscordChip';

export function DiscordIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faDiscord} {...props} />;
}

export function TwitchIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faTwitch} {...props} />;
}

export function YoutubeIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faYoutube} {...props} />;
}
