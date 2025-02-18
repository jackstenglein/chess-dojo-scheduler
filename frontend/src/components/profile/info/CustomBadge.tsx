import { Tooltip } from '@mui/material';
import Image from 'next/image';
import React from 'react';
import { Badge } from './badgeHandler';

interface CustomBadgeProps {
    badge: Badge;
    handleBadgeClick: (badge: Badge) => void;
    isBlocked?: boolean;
}

const CustomBadge: React.FC<CustomBadgeProps> = ({
    badge,
    handleBadgeClick,
    isBlocked,
}) => {
    return (
        <Tooltip title={badge.title} arrow>
            <Image
                src={badge.image}
                width={50}
                height={50}
                style={{
                    cursor: isBlocked ? 'default' : 'pointer',
                    filter: badge.glowHexcode
                        ? `drop-shadow(0 0 12px ${badge.glowHexcode})`
                        : undefined,
                    borderRadius: '8px',
                }}
                alt={badge.title}
                onClick={() => !isBlocked && handleBadgeClick(badge)}
            />
        </Tooltip>
    );
};

export default CustomBadge;
