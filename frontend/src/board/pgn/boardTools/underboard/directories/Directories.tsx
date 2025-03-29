import { useAuth } from '@/auth/Auth';
import { DirectoriesSection } from '@/profile/directories/DirectoriesSection';
import { DirectoryCacheProvider } from '@/profile/directories/DirectoryCache';
import { CardContent } from '@mui/material';

export const Directories = () => {
    const { user } = useAuth();
    if (!user) {
        return null;
    }

    return (
        <CardContent sx={{ height: 1 }}>
            <DirectoryCacheProvider>
                <DirectoriesSection
                    namespace='games-page'
                    defaultDirectoryOwner={user.username}
                    enableNavigationMenu
                    defaultNavigationMenuOpen={false}
                    defaultColumnVisibility={{
                        type: true,
                        name: true,
                        result: true,
                        owner: false,
                        createdAt: false,
                    }}
                />
            </DirectoryCacheProvider>
        </CardContent>
    );
};
