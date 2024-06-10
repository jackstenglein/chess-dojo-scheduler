import { AccountBalance, CreditCard, Help } from '@mui/icons-material';
import {
    Card,
    CardContent,
    CardHeader,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { StripeAccount, StripePayoutMethod } from '../../../database/payment';

const PayoutsCard = ({ account }: { account?: StripeAccount }) => {
    if (!account) {
        return null;
    }

    let interval: string = account.settings.payouts.schedule.interval;
    interval = interval.substring(0, 1).toUpperCase() + interval.substring(1);

    return (
        <Card variant='outlined'>
            <CardHeader title='Payouts' />
            <CardContent>
                <Stack spacing={3}>
                    <Stack spacing={1}>
                        <Typography variant='h6'>Schedule</Typography>

                        <Table size='small'>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        <Stack direction='row' spacing={1}>
                                            <Typography variant='body2'>
                                                Interval
                                            </Typography>
                                            <Tooltip title='How frequently funds are paid out'>
                                                <Help
                                                    sx={{ color: 'text.secondary' }}
                                                    fontSize='small'
                                                />
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align='center'>
                                        <Typography>{interval}</Typography>
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell>
                                        <Stack direction='row' spacing={1}>
                                            <Typography variant='body2'>
                                                Holding Period
                                            </Typography>
                                            <Tooltip title='How long funds are held before being paid out'>
                                                <Help
                                                    sx={{ color: 'text.secondary' }}
                                                    fontSize='small'
                                                />
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align='center'>
                                        <Typography>
                                            {account.settings.payouts.schedule.delay_days}{' '}
                                            Days
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Stack>

                    {account.external_accounts.total_count > 0 && (
                        <Stack spacing={1.5}>
                            <Typography variant='h6'>Payout Method</Typography>

                            <Stack direction='row' alignItems='center' spacing={1}>
                                {account.external_accounts.data[0].object ===
                                StripePayoutMethod.BankAccount ? (
                                    <>
                                        <AccountBalance
                                            sx={{ color: 'text.secondary' }}
                                        />
                                        <Typography>Bank Account</Typography>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard sx={{ color: 'text.secondary' }} />
                                        <Typography>Debit Card</Typography>
                                    </>
                                )}
                            </Stack>
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default PayoutsCard;
