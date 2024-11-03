import { ClubLocation } from '@/database/club';
import { Place } from '@mui/icons-material';
import { Chip } from '@mui/material';

interface LocationChipProps {
    location: ClubLocation;
}

export const LocationChip: React.FC<LocationChipProps> = ({ location }) => {
    if (!location.city && !location.state && !location.country) {
        return null;
    }

    let locationStr = location.city;

    if (location.state) {
        if (locationStr) {
            locationStr = `${locationStr}, ${location.state}`;
        } else {
            locationStr = location.state;
        }
    }

    if (location.country) {
        if (locationStr) {
            if (!location.city || !location.state) {
                locationStr = `${locationStr}, ${location.country}`;
            }
        } else {
            locationStr = location.country;
        }
    }

    return (
        <Chip color='secondary' icon={<Place sx={{ pl: '4px' }} />} label={locationStr} />
    );
};
