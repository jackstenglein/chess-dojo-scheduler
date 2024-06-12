import {
    Card,
    CardActionArea,
    CardContent,
    Container,
    Stack,
    SvgIconProps,
    SvgIconTypeMap,
    Typography,
} from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { Link } from 'react-router-dom';
import { useRequiredAuth } from '../auth/Auth';
import TacticsScoreCard from '../profile/stats/TacticsScoreCard';
import { KingIcon, QueenIcon, RookIcon } from '../style/ChessIcons';
import ExamGraphComposer from './list/ExamGraphComposer';
/**
 * Renders a simple landing page that directs users to the different types of exams
 * (tactics, polgar, endgame, etc).
 */
export const ExamLandingPage = () => {
    const auth = useRequiredAuth();
    const user = auth.user;
    

    return (
        <Container maxWidth='lg' sx={{ py: 5 }}>
            <Stack spacing={3}>
                <Typography variant='h4' align='center'>
                    ChessDojo Tactics Tests
                </Typography>
                <Typography>
                    Lorem Ipsum is simply dummy text of the printing and typesetting
                    industry. Lorem Ipsum has been the industry's standard dummy text ever
                    since the 1500s, when an unknown printer took a galley of type and
                </Typography>
            </Stack>
            <Stack spacing={3}>
                <Stack spacing={3}>
                    <Typography variant='h5' align='center'>
                        My Tactics Rating
                    </Typography>
                </Stack>

                <TacticsScoreCard user={user} />

                <Stack spacing={3}>
                    <Typography variant='h5' align='center'>
                        Tests History
                    </Typography>
                </Stack>

                <ExamGraphComposer/>

                <Stack spacing={3}>
                    <Typography variant='h5' align='center'>
                        Attempt Test
                    </Typography>
                </Stack>

                <Grid2 container rowSpacing={2} columnSpacing={3}>
                    <ExamCard
                        name='Start Tactics Tests'
                        description='All Ratings'
                        href='/tests/tactics'
                        icon={QueenIcon}
                    />

                    <ExamCard
                        name='Start Checkmate Tests'
                        description='All Ratings'
                        href='/tests/checkmate'
                        icon={KingIcon}
                    />

                    <ExamCard
                        name='Start Endgame Tests'
                        description='All Ratings'
                        href='/tests/endgame'
                        icon={RookIcon}
                    />
                </Grid2>
            </Stack>
        </Container>
    );
};

interface ExamCardProps {
    name: string;
    description: string;
    href: string;
    icon:
        | ((props: SvgIconProps) => JSX.Element)
        | (OverridableComponent<SvgIconTypeMap> & { muiName: string });
    disabled?: boolean;
}

const ExamCard = ({ name, description, href, icon, disabled }: ExamCardProps) => {
    const Icon = icon;
    return (
        <Grid2 xs={12} sm={6} md={4}>
            <Card
                variant={disabled ? 'outlined' : 'elevation'}
                sx={{ opacity: disabled ? 0.8 : 1, height: 1 }}
            >
                <CardActionArea
                    component={Link}
                    disabled={disabled}
                    to={href}
                    sx={{ height: 1 }}
                >
                    <CardContent>
                        <Stack justifyContent='center' alignItems='center'>
                            <Icon sx={{ fontSize: '5rem', mb: 2 }} color='primary' />
                            <Typography variant='h5' mb={0.5}>
                                {name}
                            </Typography>
                            <Typography
                                variant='subtitle1'
                                color='text.secondary'
                                lineHeight='1.3'
                            >
                                {description}
                            </Typography>
                        </Stack>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid2>
    );
};
