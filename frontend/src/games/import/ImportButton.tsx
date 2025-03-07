import { LoadingButton } from '@mui/lab';

export interface ImportButtonProps {
    onClick: () => void;
    loading: boolean;
}

export const ImportButton = ({ onClick, loading }: ImportButtonProps) => (
    <LoadingButton data-cy='import-button' name='import' loading={loading} onClick={onClick}>
        Import
    </LoadingButton>
);
