import { Container } from '@mui/material';
import WidgetBot from '@widgetbot/react-embed';
import { useFreeTier } from '../auth/Auth';
import { getConfig } from '../config';
import { RestrictedAction } from '../upsell/UpsellDialog';
import UpsellPage from '../upsell/UpsellPage';

const config = getConfig();

const ChatPage = () => {
    const isFreeTier = useFreeTier();

    if (isFreeTier) {
        return (
            <UpsellPage redirectTo='/' currentAction={RestrictedAction.SubscriberChat} />
        );
    }

    return (
        <Container
            maxWidth={false}
            sx={{ py: 3, height: 'calc(100vh - var(--navbar-height))' }}
        >
            <WidgetBot
                server={config.chat.server}
                channel={config.chat.channel}
                height='100%'
                width='100%'
            />
        </Container>
    );
};

export default ChatPage;
