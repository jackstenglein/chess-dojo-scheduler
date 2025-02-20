import { Tooltip } from '@mui/material';
import Image from 'next/image';
import { Badge } from './badgeHandler';

interface BadgeImageProps {
    badge: Badge;
    onClick?: (badge: Badge) => void;
}

/**
 * Renders an image for the given badge.
 * @param badge The badge to render.
 * @param onClick A callback invoked when the image is clicked.
 * @returns
 */
export function BadgeImage({ badge, onClick }: BadgeImageProps) {
    return (
        <Tooltip title={badge.title} arrow>
            <Image
                src={badge.image}
                width={50}
                height={50}
                style={{
                    cursor: !badge.isEarned || !onClick ? 'default' : 'pointer',
                    filter: badge.glowHexcode
                        ? `drop-shadow(0 0 12px ${badge.glowHexcode})`
                        : undefined,
                    borderRadius: '8px',
                }}
                alt={badge.title}
                onClick={() => onClick?.(badge)}
            />
        </Tooltip>
    );
}
