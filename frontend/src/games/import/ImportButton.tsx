import { LoadingButton } from '@mui/lab';

export interface ImportButtonProps {
    onClick: () => void;
    loading: boolean;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onClick, loading }) => (
    <LoadingButton
        sx={{ alignSelf: 'flex-end' }}
        data-cy='submit'
        variant='contained'
        loading={loading}
        name='import'
        onClick={onClick}
    >
        Import
    </LoadingButton>
);
