import { Tooltip } from '@mui/material';
import Image from 'next/image';
import { Badge } from './badgeHandler';

interface CustomBadgeProps {
    badge: Badge;
    handleBadgeClick?: (badge: Badge) => void;
    isBlocked?: boolean;
}

function CustomBadge({ badge, handleBadgeClick, isBlocked }: CustomBadgeProps) {
    const onClick = () => {
        if (!isBlocked && handleBadgeClick) {
            handleBadgeClick(badge);
        }
    };

    return (
        <Tooltip title={badge.title} arrow>
            <Image
                src={badge.image}
                width={50}
                height={50}
                style={{
                    cursor: isBlocked || !handleBadgeClick ? 'default' : 'pointer',
                    filter: badge.glowHexcode
                        ? `drop-shadow(0 0 12px ${badge.glowHexcode})`
                        : undefined,
                    borderRadius: '8px',
                }}
                alt={badge.title}
                onClick={onClick}
            />
        </Tooltip>
    );
}

export default CustomBadge;
