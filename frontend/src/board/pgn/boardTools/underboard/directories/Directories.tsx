import { useRequiredAuth } from '@/auth/Auth';
import { useSearchParams } from '@/hooks/useSearchParams';
import { DirectoriesTab } from '@/profile/directories/DirectoriesTab';
import { DirectoryCacheProvider } from '@/profile/directories/DirectoryCache';
import { CardContent } from '@mui/material';

export const Directories = () => {
    const { user } = useRequiredAuth();
    const { searchParams } = useSearchParams();

    return (
        <CardContent sx={{ height: 1 }}>
            <DirectoryCacheProvider>
                <DirectoriesTab
                    username={searchParams.get('directoryOwner') || user.username}
                />
            </DirectoryCacheProvider>
        </CardContent>
    );
};
