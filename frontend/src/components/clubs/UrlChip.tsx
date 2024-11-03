import { OpenInNew } from '@mui/icons-material';
import { Chip } from '@mui/material';

interface UrlChipProps {
    url: string;
}

const urlRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/gim;

export const UrlChip: React.FC<UrlChipProps> = ({ url }) => {
    if (!url) {
        return null;
    }

    const matches = [...url.matchAll(urlRegex)][0];
    if (!matches || matches.length < 2) {
        return null;
    }

    const domain = matches[1];
    return (
        <a href={url} target='_blank' rel='noreferrer'>
            <Chip
                color='secondary'
                icon={<OpenInNew sx={{ pl: '4px' }} />}
                label={domain}
            />
        </a>
    );
};
