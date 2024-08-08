import { useSearchParams } from '@/hooks/useSearchParams';
import { NavigateNext } from '@mui/icons-material';
import { Breadcrumbs, Link } from '@mui/material';
import { BreadcrumbItem, useBreadcrumbs } from './DirectoryCache';

export const DirectoryBreadcrumbs = ({
    owner,
    id,
    onClick,
}: {
    owner: string;
    id: string;
    onClick?: (id: string) => void;
}) => {
    const { updateSearchParams } = useSearchParams();
    const currentBreadcrumbs = useBreadcrumbs(owner, id);

    if (currentBreadcrumbs.length === 0) {
        return null;
    }

    const handleClick = (item: BreadcrumbItem) => {
        if (onClick) {
            onClick(item.id);
        } else {
            updateSearchParams({ directory: item.id });
        }
    };

    return (
        <Breadcrumbs separator={<NavigateNext fontSize='small' />}>
            {currentBreadcrumbs.map((b) => (
                <Link
                    key={b.id}
                    underline='hover'
                    color='inherit'
                    onClick={() => handleClick(b)}
                    sx={{ cursor: 'pointer' }}
                >
                    {b.name}
                </Link>
            ))}
        </Breadcrumbs>
    );
};
