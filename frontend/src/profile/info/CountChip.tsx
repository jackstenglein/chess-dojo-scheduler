import { Chip, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
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
                icon={<PersonIcon fontSize='small'/>}
                
            />
        </Link>
    );
};

export default CountChip;
