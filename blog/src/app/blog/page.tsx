import {
    Button,
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
import Link from 'next/link';
import items from './items';

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
                            <Image
                                src={item.image.src}
                                alt={item.image.alt}
                                style={{ width: '100%', height: 'auto' }}
                                priority={i === 0}
                            />
                            <CardHeader title={item.title} subheader={item.subtitle} />

                            <CardContent>
                                <Typography variant='body1'>{item.body}</Typography>
                            </CardContent>
                        </CardActionArea>
                        <CardActions>
                            <Button>Share</Button>
                        </CardActions>
                    </Card>
                ))}
            </Stack>
        </Container>
    );
}
