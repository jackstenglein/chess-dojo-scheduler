import { Link, Typography, useTheme } from '@mui/material';
import ReactMarkdown from 'react-markdown';

const allowedElements = [
    'code',
    'p',
    'pre',
    'a',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
];

interface MarkdownProps {
    text: string;
    inline?: boolean;
}

const Markdown: React.FC<MarkdownProps> = ({ text, inline }) => {
    const theme = useTheme();

    return (
        <ReactMarkdown
            skipHtml
            allowedElements={allowedElements}
            components={{
                code: (props) => <Text inline={inline}>{props.children}</Text>,
                p: (props) => <Text inline={inline}>{props.children}</Text>,
                pre: (props) => <>{props.children}</>,
                a: (props) => (
                    <Link href={props.href} target='_blank' rel='noreferrer'>
                        {props.children}
                    </Link>
                ),
                h1: (props) => <Text {...props} inline={inline} fontSize='1.25rem' />,
                h2: (props) => <Text {...props} inline={inline} fontSize='1.1875rem' />,
                h3: (props) => <Text {...props} inline={inline} fontSize='1.125rem' />,
                h4: (props) => <Text {...props} inline={inline} fontSize='1.0625rem' />,
                h5: (props) => <Text {...props} inline={inline} fontSize='1rem' />,
                h6: (props) => <Text {...props} inline={inline} fontSize='0.9375rem' />,
                ul: (props) => (
                    <ul
                        style={{
                            margin: '4px 0',
                            paddingLeft: '24px',
                            fontSize: '0.875rem',
                        }}
                    >
                        {props.children}
                    </ul>
                ),
                ol: (props) => (
                    <ol
                        style={{
                            margin: '4px 0',
                            paddingLeft: '26px',
                            fontSize: '0.875rem',
                        }}
                    >
                        {props.children}
                    </ol>
                ),
                li: (props) => <li>{props.children}</li>,
                blockquote: (props) => (
                    <blockquote
                        style={{
                            margin: '6px 10px',
                            borderLeft: `0.25em solid ${theme.palette.divider}`,
                        }}
                    >
                        {props.children}
                    </blockquote>
                ),
            }}
        >
            {text.trim()}
        </ReactMarkdown>
    );
};

function Text(props: any) {
    return (
        <Typography
            variant={props.inline ? 'caption' : 'body2'}
            display={props.inline ? 'inline' : undefined}
            mx={props.inline ? '4px' : undefined}
            color='text.secondary'
            p={props.p || '6px'}
            whiteSpace='pre-line'
            fontSize={props.fontSize}
        >
            {props.children}
        </Typography>
    );
}

export default Markdown;
