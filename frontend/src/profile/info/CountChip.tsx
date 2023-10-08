import { Chip, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface CountChipProps {
    count: number;
    label: string;
    singularLabel?: string;
    link: string;
}

const CountChip: React.FC<CountChipProps> = ({ count, label, singularLabel, link }) => {
    return (
        <Link component={RouterLink} to={link}>
            <Chip
                label={`${count} ${count === 1 ? singularLabel || label : label}`}
                variant='outlined'
                color='secondary'
            />
        </Link>
    );
};

export default CountChip;
