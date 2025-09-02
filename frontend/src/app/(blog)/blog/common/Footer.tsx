import { Stack, Typography } from '@mui/material';
import Image from 'next/image';
import logoBlack from './logoBlack.png';

export function Footer({
    utmSource = 'newsletter',
    utmMedium = 'blog',
    utmCampaign,
}: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign: string;
}) {
    return (
        <Stack alignItems='center' mt={4}>
            <a
                href={`https://www.chessdojo.club?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`}
                target='_blank'
                rel='noopener noreferrer'
                style={{ cursor: 'pointer', textDecoration: 'none' }}
            >
                <Stack
                    direction='row'
                    justifyContent='center'
                    alignItems='center'
                    gap='30px'
                    sx={{
                        maxWidth: '400px',
                        backgroundColor: '#F4931E',
                        padding: '20px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                    }}
                >
                    <Image src={logoBlack} alt='' width={80} height={80} />
                    <Typography fontWeight='bold' textAlign='center' color='black'>
                        Check Out ChessDojo.Club To Improve Your Chess
                    </Typography>
                </Stack>
            </a>
        </Stack>
    );
}
