import { Button, ButtonProps } from '@mui/material';
import { Link } from '../navigation/Link';

export function JoinDojoButton(props: ButtonProps) {
    return (
        <Button
            variant='contained'
            component={Link}
            href='/signup'
            color='dojoOrange'
            {...props}
            sx={{
                fontSize: '1rem',
                fontWeight: '600',
                py: '0.75rem',
                px: '1.25rem',
                ...props.sx,
            }}
        >
            Join the Dojo
        </Button>
    );
}
