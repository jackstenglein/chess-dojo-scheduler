import {
    Card,
    CardActionArea,
    CardContent,
    Grid,
    Stack,
    SvgIconProps,
    SvgIconTypeMap,
    Typography,
} from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

interface ExamCardProps {
    name: string;
    description: string;
    href: string;
    icon:
        | ((props: SvgIconProps) => JSX.Element)
        | (OverridableComponent<SvgIconTypeMap> & { muiName: string });
    disabled?: boolean;
}

export const ExamCard = ({ name, description, href, icon, disabled }: ExamCardProps) => {
    const Icon = icon;
    return (
        <Grid
            size={{
                xs: 12,
                sm: 6,
                md: 4,
            }}
        >
            <Card
                variant={disabled ? 'outlined' : 'elevation'}
                sx={{ opacity: disabled ? 0.8 : 1, height: 1 }}
            >
                <CardActionArea component='a' disabled={disabled} href={href} sx={{ height: 1 }}>
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
                                textAlign='center'
                            >
                                {description}
                            </Typography>
                        </Stack>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
};
