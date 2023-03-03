import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Box } from '@mui/material';

interface ScoreboardCheckProps {
    value: number;
    total: number;
}

const ScoreboardCheck: React.FC<ScoreboardCheckProps> = ({ value, total }) => {
    return (
        <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
            {value < total ? (
                <CheckBoxOutlineBlankIcon />
            ) : (
                <CheckBoxIcon color='primary' />
            )}
        </Box>
    );
};

export default ScoreboardCheck;
