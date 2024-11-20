import PersonIcon from '@mui/icons-material/Person';
import { Chip, Link } from '@mui/material';
import RouterLink from 'next/link';

interface CountChipProps {
    count: number;
    label: string;
    singularLabel?: string;
    link: string;
}

const CountChip: React.FC<CountChipProps> = ({ count, label, singularLabel, link }) => {
    return (
        <Link component={RouterLink} href={link}>
            <Chip
                label={`${count} ${count === 1 ? singularLabel || label : label}`}
                variant='outlined'
                color='secondary'
                icon={<PersonIcon fontSize='small' />}
            />
        </Link>
    );
};

export default CountChip;
