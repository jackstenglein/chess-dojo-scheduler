'use client';

import { pagesWithVideos } from '@/hooks/useRouter';
import { LinkProps, Link as MuiLink } from '@mui/material';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef } from 'react';

/**
 * Renders a MUI link to another page. If the link is relative and to a page
 * that needs the same headers as the current page, it uses the NextJS
 * Link component for client-side routing. Otherwise, it uses an a tag.
 * @param props The props passed to the MUI Link component.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
    const pathname = usePathname();

    let useNextLink = true;

    if (!props.href || props.href.startsWith('http')) {
        useNextLink = false;
    } else {
        let currentHasVideo = false;
        let newHasVideo = false;

        for (const page of pagesWithVideos) {
            if (!currentHasVideo && pathname.match(page)) {
                currentHasVideo = true;
            }
            if (!newHasVideo && props.href.match(page)) {
                newHasVideo = true;
            }
        }

        useNextLink = currentHasVideo === newHasVideo;
    }

    const component = props.component || (useNextLink ? NextLink : 'a');
    return <MuiLink ref={ref} {...props} component={component} />;
});
Link.displayName = 'Link';
