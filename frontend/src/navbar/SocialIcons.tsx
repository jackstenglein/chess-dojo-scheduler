import { faPatreon, faSpotify, faTwitch } from '@fortawesome/free-brands-svg-icons';
import { FacebookOutlined, Instagram, Twitter, YouTube } from '@mui/icons-material';
import { IconButton, Stack, Tooltip, useMediaQuery } from '@mui/material';
import { DiscordIcon, FontAwesomeSvgIcon } from '../profile/info/DiscordChip';

const icons = [
    <Tooltip key='twitch' title='Twitch'>
        <IconButton href='http://twitch.tv/chessdojo' target='_blank' rel='noopener'>
            <FontAwesomeSvgIcon icon={faTwitch} />
        </IconButton>
    </Tooltip>,

    <Tooltip key='youtube' title='YouTube'>
        <IconButton
            href='https://www.youtube.com/chessdojo'
            target='_blank'
            rel='noopener'
        >
            <YouTube />
        </IconButton>
    </Tooltip>,

    <Tooltip key='discord' title='Discord'>
        <IconButton href='https://discord.gg/GnmmegXAsa' target='_blank' rel='noopener'>
            <DiscordIcon />
        </IconButton>
    </Tooltip>,

    <Tooltip key='twitter' title='Twitter'>
        <IconButton href='https://twitter.com/chessdojo' target='_blank' rel='noopener'>
            <Twitter />
        </IconButton>
    </Tooltip>,

    <Tooltip key='spotify' title='Spotify'>
        <IconButton
            href='https://open.spotify.com/show/0TcZHYLLx2KMe33YAgtyS6?si=943acce8c5aa4b1a'
            target='_blank'
            rel='noopener'
        >
            <FontAwesomeSvgIcon icon={faSpotify} />
        </IconButton>
    </Tooltip>,

    <Tooltip key='patreon' title='Patreon'>
        <IconButton
            href='https://www.patreon.com/ChessDojo'
            target='_blank'
            rel='noopener'
        >
            <FontAwesomeSvgIcon icon={faPatreon} />
        </IconButton>
    </Tooltip>,

    <Tooltip key='instagram' title='Instagram'>
        <IconButton
            href='https://www.instagram.com/chessdojo/'
            target='_blank'
            rel='noopener'
        >
            <Instagram />
        </IconButton>
    </Tooltip>,

    <Tooltip key='facebook' title='Facebook'>
        <IconButton href='http://facebook.com/chessdojo' target='_blank' rel='noopener'>
            <FacebookOutlined />
        </IconButton>
    </Tooltip>,
];

const SocialIcons = () => {
    const showAll = useMediaQuery('(min-width:1272px)');
    const hide1 = useMediaQuery('(min-width:1232px)');
    const hide2 = useMediaQuery('(min-width:1191px)');
    const hide3 = useMediaQuery('(min-width:1155px)');
    const hide4 = useMediaQuery('(min-width:1120px)');
    const hide5 = useMediaQuery('(min-width:1084px)');
    const hide6 = useMediaQuery('(min-width:1045px)');
    const hide7 = useMediaQuery('(min-width:1005px)');

    let displayedIcons: JSX.Element[] = [];

    if (showAll) {
        displayedIcons = icons;
    } else if (hide1) {
        displayedIcons = icons.slice(0, -1);
    } else if (hide2) {
        displayedIcons = icons.slice(0, -2);
    } else if (hide3) {
        displayedIcons = icons.slice(0, -3);
    } else if (hide4) {
        displayedIcons = icons.slice(0, -4);
    } else if (hide5) {
        displayedIcons = icons.slice(0, -5);
    } else if (hide6) {
        displayedIcons = icons.slice(0, -6);
    } else if (hide7) {
        displayedIcons = icons.slice(0, -7);
    }

    if (displayedIcons.length === 0) {
        return null;
    }

    return (
        <Stack direction='row' alignItems='center'>
            {displayedIcons}
        </Stack>
    );
};

export default SocialIcons;
