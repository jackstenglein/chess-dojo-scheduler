import { Link } from '@/components/navigation/Link';
import { LinkProps, Typography } from '@mui/material';
import Markdown from 'react-markdown';

const MARKDOWN_COMPONENTS = {
    p: Typography,
    a: TaskDescriptionLink,
};

/**
 * Renders the description for a task. The description should be a markdown string.
 * @param children The description to render.
 */
export function TaskDescription({ children }: { children: string }) {
    return (
        <Markdown skipHtml components={MARKDOWN_COMPONENTS}>
            {children}
        </Markdown>
    );
}

/** Renders a link inside a task description. */
function TaskDescriptionLink(props: LinkProps) {
    const additionalProps: LinkProps = {};
    if (props.href?.startsWith('http')) {
        additionalProps.target = '_blank';
        additionalProps.rel = 'noopener';
    }
    return <Link {...props} {...additionalProps} onClick={(e) => e.stopPropagation()} />;
}
