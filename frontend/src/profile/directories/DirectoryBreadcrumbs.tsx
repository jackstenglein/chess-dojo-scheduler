import { useSearchParams } from '@/hooks/useSearchParams';
import { Directory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { NavigateNext } from '@mui/icons-material';
import { Breadcrumbs, Link } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

interface BreadcrumbItem {
    name: string;
    id: string;
}

type BreadcrumbData = Record<string, BreadcrumbItem[]>;

interface UseBreadcrumbs {
    data: BreadcrumbData;
    putBreadcrumb: (directory: Directory) => void;
}

export function useBreadcrumbs(): UseBreadcrumbs {
    const [data, setData] = useState<BreadcrumbData>({
        home: [{ name: 'Home', id: 'home' }],
    });

    const putBreadcrumb = useCallback(
        (directory: Directory) => {
            if (data[directory.id]) {
                return;
            }

            if (data[directory.parent]) {
                setData({
                    ...data,
                    [directory.id]: data[directory.parent].concat({
                        name: directory.name,
                        id: directory.id,
                    }),
                });
            }
        },
        [data],
    );

    return { data, putBreadcrumb };
}

export const DirectoryBreadcrumbs = ({
    directory,
    breadcrumbs,
}: {
    directory: Directory;
    breadcrumbs: UseBreadcrumbs;
}) => {
    const { data, putBreadcrumb } = breadcrumbs;
    const { updateSearchParams } = useSearchParams();

    useEffect(() => {
        putBreadcrumb(directory);
    }, [directory, putBreadcrumb]);

    const currentBreadcrumbs = data[directory.id];
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
