import { Typography } from '@mui/material';

interface BioProps {
    bio?: string;
}

const Bio: React.FC<BioProps> = ({ bio }) => {
    if (!bio) {
        return null;
    }

    return (
        <Typography variant='body1' sx={{ whiteSpace: 'pre-line' }}>
            {bio}
        </Typography>
    );
};

export default Bio;
