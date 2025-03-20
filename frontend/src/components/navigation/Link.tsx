'use client';

import { pagesWithVideos } from '@/hooks/useRouter';
import { LinkProps, Link as MuiLink } from '@mui/material';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationGuardProviderContext } from 'node_modules/next-navigation-guard/dist/components/NavigationGuardProviderContext';
import { forwardRef, useContext } from 'react';

/**
 * Renders a MUI link to another page. If the link is relative and to a page
 * that needs the same headers as the current page, it uses the NextJS
 * Link component for client-side routing. Otherwise, it uses an a tag.
 * @param props The props passed to the MUI Link component.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
    const pathname = usePathname();
    const guardMapRef = useContext(NavigationGuardProviderContext);

    let useNextLink = true;
    let guardNavigation: React.MouseEventHandler<HTMLAnchorElement> | undefined = undefined;

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

    const href = props.href;
    if (!useNextLink && guardMapRef && href) {
        for (const guard of guardMapRef.current.values()) {
            const { enabled, callback } = guard;
            if (!enabled({ to: href, type: 'push' })) {
                continue;
            }

            guardNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                e.stopPropagation();
                props.onClick?.(e);

                let confirmed = callback({ to: href, type: 'push' });
                if (typeof confirmed === 'boolean') {
                    confirmed = Promise.resolve(confirmed);
                }

                void confirmed.then((confirmed) => {
                    if (!confirmed) {
                        return;
                    }

                    guard.enabled = () => false;
                    window.location.href = href;
                });
            };
            break;
        }
    }

    const component = props.component || (useNextLink ? NextLink : 'a');
    return (
        <MuiLink
            ref={ref}
            {...props}
            component={component}
            onClick={guardNavigation ?? props.onClick}
        />
    );
});
Link.displayName = 'Link';
