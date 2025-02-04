import { useFreeTier } from '@/auth/Auth';
import { Link } from '@/components/navigation/Link';
import { getConfig } from '@/config';
import UpsellDialog, { RestrictedAction } from '@/upsell/UpsellDialog';
import { useState } from 'react';

const config = getConfig();

/**
 * Renders a help item for Discord. This is a separate component because
 * we need the useFreeTier hook to check whether the user can access the
 * paid Discord.
 */
export function DiscordHelpItem() {
    const isFreeTier = useFreeTier();
    const [showDialog, setShowDialog] = useState(false);

    return (
        <>
            Subscribers to the Dojo training program can use our{' '}
            <Link
                href={isFreeTier ? undefined : config.discord.privateUrl}
                target='_blank'
                rel='noopener'
                onClick={isFreeTier ? () => setShowDialog(true) : undefined}
            >
                private Discord server
            </Link>{' '}
            to find training partners and communicate with other members. Free-tier users
            can enjoy the Dojo's{' '}
            <Link href={config.discord.publicUrl} target='_blank' rel='noopener'>
                public Discord server
            </Link>
            , which also has exciting events like the open classical tournaments and
            weekly team battles!
            {showDialog && (
                <UpsellDialog
                    open
                    onClose={() => setShowDialog(false)}
                    currentAction={RestrictedAction.JoinDiscord}
                />
            )}
        </>
    );
}
