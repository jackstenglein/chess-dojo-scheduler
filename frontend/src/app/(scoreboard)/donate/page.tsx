import { Link } from '@/components/navigation/Link';
import { Container, Typography } from '@mui/material';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Donate to ChessDojo',
    description:
        'Interested in supporting the Dojo without getting a membership? All contributions are greatly appreciated and help keep the Dojo going! We have many ways you can help out.',
};

export default function Page() {
    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <Typography variant='h4'>Support the Dojo</Typography>

            <Typography component='div' variant='h6' mt={2}>
                Interested in supporting the Dojo without getting a membership? All contributions
                are greatly appreciated and help keep the Dojo going! We have many ways you can help
                out:
                <ul>
                    <li>
                        <Link target='_blank' href='https://buy.stripe.com/aEUbJxaa40Xb84UcN2'>
                            Sponsor Dojo content
                        </Link>
                    </li>
                    <li>
                        <Link target='_blank' href='https://buy.stripe.com/aEUbJxaa40Xb84UcN2'>
                            Sponsor another user's Dojo membership
                        </Link>
                    </li>
                    <li>
                        <Link target='_blank' href='https://buy.stripe.com/aEUbJxaa40Xb84UcN2'>
                            Sponsor tournament prizes
                        </Link>
                    </li>
                    <li>
                        <Link target='_blank' href='https://buy.stripe.com/aEUbJxaa40Xb84UcN2'>
                            Join our Patreon
                        </Link>
                    </li>
                    <li>
                        <Link href='/courses'>Purchase one of our courses</Link>
                    </li>
                    <li>
                        <Link target='_blank' href='https://www.chessdojo.shop/shop'>
                            Purchase merch
                        </Link>
                    </li>
                    <li>
                        <Link
                            target='_blank'
                            href='https://www.chess.com/membership?ref_id=9504732'
                        >
                            Use our referral for a Chess.com diamond membership
                        </Link>
                    </li>
                </ul>
            </Typography>

            <Typography component='div' variant='h6' mt={6}>
                There are many free ways to support the Dojo as well! For example:
                <ul>
                    <li>Clipping your favorite moments on Twitch</li>
                    <li>Sharing our videos and clips with your friends and on social media</li>
                    <li>Liking and commenting on our YouTube videos</li>
                    <li>Offering volunteer help</li>
                </ul>
            </Typography>

            <Typography variant='h5' mt={6}>
                Volunteering
            </Typography>
            <Typography component='div' variant='h6' mt={1}>
                Please message @hellokostya on Discord if you're interested in helping out with any
                of the following categories:
                <ul>
                    <li>
                        Admin/Organizational — organizing events, both on-stream and off-stream,
                        modding, etc.
                    </li>
                    <li>
                        Programming — Discord bots, contributions to the website, Google Sheets, and
                        other tech stuff!
                    </li>
                    <li>Content — thumbnails, posting clips on social media, etc.</li>
                </ul>
            </Typography>
        </Container>
    );
}
