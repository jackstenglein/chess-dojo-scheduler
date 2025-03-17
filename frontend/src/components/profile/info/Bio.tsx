import { Link, Typography } from '@mui/material';
import Markdown from 'react-markdown';

const allowedElements = ['p', 'a'];

interface BioProps {
    bio?: string;
}

const Bio: React.FC<BioProps> = ({ bio }) => {
    if (!bio) {
        return null;
    }

    return (
        <Markdown
            skipHtml
            allowedElements={allowedElements}
            components={{
                p: (props) => (
                    <Typography sx={{ whiteSpace: 'pre-line' }}>{props.children}</Typography>
                ),
                a: (props) => (
                    <Link href={props.href} target='_blank' rel='noreferrer'>
                        {props.children}
                    </Link>
                ),
            }}
        >
            {bio}
        </Markdown>
    );
};

export default Bio;
