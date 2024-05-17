'use client';

import {
    AppBar,
    Container,
    Slide,
    Toolbar,
    useMediaQuery,
    useScrollTrigger,
} from '@mui/material';
import NavbarMenu from './NavbarMenu';

interface HideOnScrollProps {
    children: React.ReactElement;
}

function HideOnScroll(props: HideOnScrollProps) {
    const isMedium = useMediaQuery((theme: any) => theme.breakpoints.up('md'));
    const trigger = useScrollTrigger({ threshold: 20 });

    return (
        <Slide appear={false} direction='down' in={!trigger || isMedium}>
            {props.children}
        </Slide>
    );
}

const Navbar = () => {
    return (
        <HideOnScroll>
            <AppBar
                data-cy='navbar'
                position='sticky'
                sx={{ zIndex: 1300, height: 'var(--navbar-height)' }}
            >
                <Container maxWidth={false} sx={{ height: 1 }}>
                    <Toolbar disableGutters sx={{ height: 1 }}>
                        <NavbarMenu />
                    </Toolbar>
                </Container>
            </AppBar>
        </HideOnScroll>
    );
};

export default Navbar;
