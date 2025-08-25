import { Link } from '@/components/navigation/Link';
import { FontAwesomeSvgIcon } from '@/style/Icon';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Chip, SvgIconProps, Tooltip } from '@mui/material';

export function DiscordIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faDiscord} {...props} />;
}

interface DiscordChipProps {
    /** The discord username to display. */
    username?: string;
    /** The discord id associated with the username. */
    id?: string;
}

const DiscordChip: React.FC<DiscordChipProps> = ({ username, id }) => {
    if (!username) {
        return null;
    }

    return (
        <Tooltip title={`The user's Discord username.${id ? ' Click to message in Discord.' : ''}`}>
            <Link
                target='_blank'
                rel='noopener'
                href={id ? `https://discord.com/users/${id}` : undefined}
            >
                <Chip
                    icon={<DiscordIcon />}
                    label={username}
                    variant='outlined'
                    color='primary'
                    size='small'
                />
            </Link>
        </Tooltip>
    );
};

export default DiscordChip;
