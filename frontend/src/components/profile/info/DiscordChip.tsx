import { FontAwesomeSvgIcon } from '@/style/Icon';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Chip, SvgIconProps, Tooltip } from '@mui/material';

export function DiscordIcon(props: SvgIconProps) {
    return <FontAwesomeSvgIcon icon={faDiscord} {...props} />;
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
