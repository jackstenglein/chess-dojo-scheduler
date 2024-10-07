import { Card, CardContent, Container } from '@mui/material';
import { ReactNode } from 'react';

export const AuthContainer = ({ children }: { children: ReactNode }) => {
    return (
        <Container maxWidth='sm' sx={{ pt: { xs: 4, sm: 10 }, pb: 4 }}>
            <Card
                sx={{
                    backgroundImage: { xs: 'none', sm: 'var(--Paper-overlay)' },
                    boxShadow: { xs: 'none', sm: 'var(--Paper-shadow)' },
                }}
            >
                <CardContent>{children}</CardContent>
            </Card>
        </Container>
    );
};
