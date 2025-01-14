import { icons } from '@/style/Icon';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    Grid2,
    Stack,
    SvgIconProps,
    SvgIconTypeMap,
    Typography,
} from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

export function TrainingTipsButton() {
    const [showDialog, setShowDialog] = useState(false);

    return (
        <>
            {showDialog && (
                <TrainingTipsDialog
                    closeDialog={() => setShowDialog(false)}
                    open={showDialog}
                    onClose={() => setShowDialog(false)}
                />
            )}
            <Button
                variant='outlined'
                color='dojoOrange'
                size='large'
                onClick={() => setShowDialog(true)}
            >
                Program Tips
            </Button>
        </>
    );
}

interface TrainingTipsDialogProps {
    open: boolean;
    onClose: () => void;
    closeDialog: () => void;
}

export default function TrainingTipsDialog({
    open,
    onClose,
    closeDialog,
}: TrainingTipsDialogProps) {
    const router = useRouter();

    const goto = (url: string) => router.push(url);

    return (
        <Dialog maxWidth='md' open={open} onClose={onClose} fullWidth>
            <DialogContent>
                <Stack spacing={2}>
                    <Stack
                        display='grid'
                        gridTemplateRows='auto 1fr'
                        alignItems='center'
                        justifyContent='center'
                        gap='2rem'
                    >
                        <TrainingTipsCard
                            name='Play Classical Games'
                            onClick={() => goto('/tournaments')}
                            icon={icons['Classical Game']}
                        >
                            <Box>
                                The senseis recommend playing 1-2 classical games per week
                                if you’re not regularly playing tournaments.
                                Over-the-board play is best for improvement, but you can
                                also play classical games online!
                            </Box>

                            <Box>
                                Join one of Dojo's current tournaments to get some serious
                                games in.
                            </Box>
                        </TrainingTipsCard>
                        <TrainingTipsCard
                            name='Annotate your Games'
                            onClick={() => goto('/games/import')}
                            icon={icons.Annotations}
                        >
                            If you’ve played some classical games recently, it’s time to
                            analyze those games! Use our Game Editor to start annotating
                            and remember to publish your analysis when you’re finished!
                        </TrainingTipsCard>
                        <TrainingTipsCard
                            name='Tactics Test'
                            onClick={() => goto('/tests')}
                            icon={icons.Tactics}
                        >
                            After Games & Analysis, Tactics is the next most important
                            category. Start with a Dojo Tactics Test, or work on
                            completing one of the tasks in the Tactics section of the
                            Training Plan below (Polgar Mates, Puzzle Rush, etc.)
                        </TrainingTipsCard>
                        <TrainingTipsCard
                            name='Suggested Tasks'
                            onClick={() => closeDialog()}
                            icon={icons['Suggested Tasks']}
                        >
                            Work through one of the suggested tasks listed here. Make sure
                            to mark your progress and log your hours!
                        </TrainingTipsCard>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
interface TrainingTipsCardProps {
    name: string;
    children: ReactNode;
    icon:
        | ((props: SvgIconProps) => JSX.Element)
        | (OverridableComponent<SvgIconTypeMap> & { muiName: string });
    onClick: () => void;
}

const TrainingTipsCard = ({ name, children, icon, onClick }: TrainingTipsCardProps) => {
    const Icon = icon;

    return (
        <Grid2
            size={{
                xs: 12,
                sm: 6,
            }}
        >
            <Card sx={{ height: 1 }}>
                <CardActionArea sx={{ height: 1 }} onClick={onClick}>
                    <CardContent>
                        <Stack
                            height={1}
                            justifyContent='center'
                            alignItems='center'
                            textAlign='center'
                        >
                            <Icon sx={{ fontSize: '4rem', mb: 2 }} color='primary' />
                            <Typography variant='h5' mb={0.5}>
                                {name}
                            </Typography>
                            <Typography
                                variant='subtitle1'
                                color='text.secondary'
                                lineHeight='1.3'
                            >
                                {children}
                            </Typography>
                        </Stack>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid2>
    );
};
