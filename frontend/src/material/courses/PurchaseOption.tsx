import { Card, CardContent, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { CoursePurchaseOption } from '../../database/course';
import BuyButton from './BuyButton';
import { useAuth } from '../../auth/Auth';

interface PurchaseOptionProps {
    purchaseOption: CoursePurchaseOption;
}

const PurchaseOption: React.FC<PurchaseOptionProps> = ({ purchaseOption }) => {
    const user = useAuth().user!;

    const { name, fullPrice, currentPrice, buyButtonId, description, sellingPoints } =
        purchaseOption;
    const percentOff = Math.round(((fullPrice - currentPrice) / fullPrice) * 100);

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack alignItems='center' spacing={3}>
                    <Stack alignItems='center'>
                        <Typography
                            variant='subtitle1'
                            fontWeight='bold'
                            color='text.secondary'
                        >
                            {name}
                        </Typography>

                        <Stack direction='row' spacing={1} alignItems='baseline'>
                            <Typography
                                variant='h6'
                                sx={{
                                    color: currentPrice > 0 ? 'error.main' : undefined,
                                    textDecoration:
                                        currentPrice > 0 ? 'line-through' : undefined,
                                }}
                            >
                                ${displayPrice(fullPrice / 100)}
                            </Typography>

                            {currentPrice > 0 && (
                                <>
                                    <Typography variant='h6' color='success.main'>
                                        ${displayPrice(currentPrice / 100)}
                                    </Typography>

                                    <Typography color='text.secondary'>
                                        (-{percentOff}%)
                                    </Typography>
                                </>
                            )}
                        </Stack>
                    </Stack>

                    {description && <Typography>{description}</Typography>}

                    {sellingPoints && (
                        <Stack spacing={1}>
                            {sellingPoints.map((sp) => (
                                <Stack key={sp.description} direction='row' spacing={1}>
                                    {sp.included ? (
                                        <CheckCircleIcon color='success' />
                                    ) : (
                                        <CancelIcon color='error' />
                                    )}
                                    <Typography>{sp.description}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}

                    <BuyButton id={buyButtonId} referenceId={user.username} />
                </Stack>
            </CardContent>
        </Card>
    );
};

function displayPrice(price: number): string {
    if (price % 1 === 0) {
        return `${price}`;
    }
    return price.toFixed(2);
}

export default PurchaseOption;
