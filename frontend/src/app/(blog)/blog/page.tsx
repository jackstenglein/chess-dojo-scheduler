import { Link } from '@/components/navigation/Link';
import {
    Card,
    CardActionArea,
    CardActions,
    CardContent,
    CardHeader,
    Container,
    Stack,
    Typography,
} from '@mui/material';
import Image from 'next/image';
import items from './items';
import ShareButton from './shareButton/ShareButton';

/**
 * Renders the main homepage of the blog.
 */
export default function Blog() {
    return (
        <Container maxWidth='sm' sx={{ py: 5 }}>
            <Stack spacing={3}>
                {items.map((item, i) => (
                    <Card key={item.title}>
                        <CardActionArea LinkComponent={Link} href={item.href}>
                            {item.image && (
                                <Image
                                    src={item.image.src}
                                    alt={item.image.alt}
                                    style={{ width: '100%', height: 'auto' }}
                                    priority={i === 0}
                                />
                            )}
                            <CardHeader title={item.title} subheader={item.subtitle} />

                            <CardContent>
                                <Typography variant='body1'>{item.body}</Typography>
                            </CardContent>
                        </CardActionArea>
                        <CardActions>
                            <ShareButton title={item.title} href={item.href} />
                        </CardActions>
                    </Card>
                ))}
            </Stack>
        </Container>
    );
}
