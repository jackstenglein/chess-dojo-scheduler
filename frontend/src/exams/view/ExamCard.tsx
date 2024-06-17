import {
    Card,
    CardActionArea,
    CardContent,
    Stack,
    SvgIconProps,
    SvgIconTypeMap,
    Typography,
} from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { Link } from 'react-router-dom';
import { ExamType } from '../../database/exam';


interface ExamCardProps {
    name: string;
    description: string;
    href: string;
    icon:
        | ((props: SvgIconProps) => JSX.Element)
        | (OverridableComponent<SvgIconTypeMap> & { muiName: string });
    disabled?: boolean;
    colorType: ExamType;
    
}

export function getColorBasedOnExamType(examType: ExamType): string {
    switch(examType){
        case ExamType.Endgame:
            return "endgameTest";
        case ExamType.Polgar:
            return "checkmateTest";
        case ExamType.Tactics:
            return "tacticsTest";
        case ExamType.Positional:
            return "positionalTest";       
    }
}

export const ExamCard = ({ name, description, href, icon, disabled, colorType}: ExamCardProps) => {
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
                            <Icon sx={{ fontSize: '5rem', mb: 2 }} color={getColorBasedOnExamType(colorType)} />
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
