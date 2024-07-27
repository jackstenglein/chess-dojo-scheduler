import { useSearchParams } from '@/hooks/useSearchParams';
import { Directory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { NavigateNext } from '@mui/icons-material';
import { Breadcrumbs, Link } from '@mui/material';
import { useEffect, useState } from 'react';

interface BreadcrumbItem {
    name: string;
    id: string;
}

type BreadcrumbData = Record<string, BreadcrumbItem[]>;

export const DirectoryBreadcrumbs = ({ directory }: { directory: Directory }) => {
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbData>({
        home: [{ name: 'Home', id: 'home' }],
    });
    const { updateSearchParams } = useSearchParams();

    useEffect(() => {
        if (breadcrumbs[directory.id]) {
            return;
        }

        if (breadcrumbs[directory.parent]) {
            setBreadcrumbs({
                ...breadcrumbs,
                [directory.id]: breadcrumbs[directory.parent].concat({
                    name: directory.name,
                    id: directory.id,
                }),
            });
        }
    }, [directory, breadcrumbs]);

    const currentBreadcrumbs = breadcrumbs[directory.id];
    if (!currentBreadcrumbs) {
        return null;
    }

    const handleClick = (item: BreadcrumbItem) => {
        updateSearchParams({ directory: item.id });
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
