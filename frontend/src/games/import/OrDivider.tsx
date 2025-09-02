import { Divider } from '@mui/material';

interface OrDividerProps {
    header?: string;
}

export const OrDivider = ({ header }: OrDividerProps) => (
    <Divider sx={{ color: 'text.secondary', mt: 2, mb: 2 }}>{header ?? 'OR'}</Divider>
);
