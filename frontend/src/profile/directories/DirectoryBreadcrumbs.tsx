import { useSearchParams } from '@/hooks/useSearchParams';
import { MoreHoriz, NavigateNext } from '@mui/icons-material';
import {
    Breadcrumbs,
    IconButton,
    Link,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
    TypographyOwnProps,
} from '@mui/material';
import { useState } from 'react';
import { BreadcrumbItem, useBreadcrumbs } from './DirectoryCache';

const MAX_ITEM_LENGTH = 50;

export const DirectoryBreadcrumbs = ({
    owner,
    id,
    onClick,
    maxItems = 3,
    variant = 'h6',
}: {
    owner: string;
    id: string;
    onClick?: (id: string) => void;
    maxItems?: number;
    variant?: TypographyOwnProps['variant'];
}) => {
    const { updateSearchParams } = useSearchParams();
    const currentBreadcrumbs = useBreadcrumbs(owner, id);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement>();

    if (currentBreadcrumbs.length === 0) {
        return null;
    }

    let hiddenBreadcrumbs = 0;
    if (currentBreadcrumbs.length > maxItems) {
        hiddenBreadcrumbs = Math.max(2, currentBreadcrumbs.length - maxItems);
    }

    const handleClick = (item: BreadcrumbItem) => {
        setMenuAnchor(undefined);
        if (onClick) {
            onClick(item.id);
        } else {
            updateSearchParams({ directory: item.id });
        }
    };

    return (
        <Stack spacing={1} direction='row' alignItems='center'>
            {hiddenBreadcrumbs > 0 && (
                <>
                    <Tooltip title='Show path'>
                        <IconButton
                            size='small'
                            onClick={(e) => setMenuAnchor(e.currentTarget)}
                        >
                            <MoreHoriz
                                fontSize='inherit'
                                sx={{ color: 'text.secondary' }}
                            />
                        </IconButton>
                    </Tooltip>

                    <NavigateNext sx={{ color: 'text.secondary' }} />

                    <Menu
                        open={!!menuAnchor}
                        anchorEl={menuAnchor}
                        onClose={() => setMenuAnchor(undefined)}
                    >
                        {currentBreadcrumbs.slice(0, hiddenBreadcrumbs).map((b) => (
                            <Tooltip
                                key={b.id}
                                title={b.name.length > MAX_ITEM_LENGTH ? b.name : ''}
                            >
                                <MenuItem key={b.id} onClick={() => handleClick(b)}>
                                    {b.name.slice(0, MAX_ITEM_LENGTH)}
                                    {b.name.length > MAX_ITEM_LENGTH && '...'}
                                </MenuItem>
                            </Tooltip>
                        ))}
                    </Menu>
                </>
            )}

            <Breadcrumbs separator={<NavigateNext fontSize='small' />}>
                {currentBreadcrumbs.slice(hiddenBreadcrumbs).map((b) => (
                    <Tooltip
                        key={b.id}
                        title={b.name.length > MAX_ITEM_LENGTH ? b.name : ''}
                    >
                        <Typography variant={variant}>
                            <Link
                                key={b.id}
                                underline='hover'
                                color='inherit'
                                onClick={() => handleClick(b)}
                                sx={{ cursor: 'pointer' }}
                            >
                                {b.name.slice(0, MAX_ITEM_LENGTH)}
                                {b.name.length > MAX_ITEM_LENGTH && '...'}
                            </Link>
                        </Typography>
                    </Tooltip>
                ))}
            </Breadcrumbs>
        </Stack>
    );
};
