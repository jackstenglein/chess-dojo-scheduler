import { Tooltip } from '@mui/material';
import Image from 'next/image';
import React from 'react';
import { Badge } from './badgeHandler';

interface CustomBadgeProps {
    badge: Badge;
    handleBadgeClick: (badge: Badge) => void;
}

const CustomBadge: React.FC<CustomBadgeProps> = ({ badge, handleBadgeClick }) => {
    return (
        <Tooltip title={badge.title} arrow>
            <Image
                src={badge.image}
                width={50}
                height={50}
                style={{
                    cursor: 'pointer',
                    filter: badge.glowHexcode
                        ? `drop-shadow(0 0 12px ${badge.glowHexcode})`
                        : undefined,
                    borderRadius: '8px',
                }}
                alt={badge.title}
                onClick={() => handleBadgeClick(badge)}
            />
        </Tooltip>
    );
};

export default CustomBadge;
