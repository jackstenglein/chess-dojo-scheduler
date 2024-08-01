import { useRequiredAuth } from '@/auth/Auth';
import { DirectoriesTab } from '@/profile/directories/DirectoriesTab';
import { DirectoryCacheProvider } from '@/profile/directories/DirectoryCache';
import { CardContent } from '@mui/material';

export const Directories = () => {
    const { user } = useRequiredAuth();

    return (
        <CardContent sx={{ height: 1 }}>
            <DirectoryCacheProvider>
                <DirectoriesTab user={user} />
            </DirectoryCacheProvider>
        </CardContent>
    );
};
