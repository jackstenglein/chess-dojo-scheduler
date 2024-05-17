import { LoadingButton } from '@mui/lab';
import { SxProps } from '@mui/material';

export interface ImportButtonProps {
    onClick: () => void;
    loading: boolean;
    sx?: SxProps;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ sx, onClick, loading }) => (
    <LoadingButton
        sx={sx}
        data-cy='submit'
        variant='contained'
        loading={loading}
        name='import'
        onClick={onClick}
    >
        Import
    </LoadingButton>
);
