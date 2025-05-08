import { ArrowForward } from '@mui/icons-material';
import { Stack, StackProps, Typography, TypographyProps } from '@mui/material';
import { BulletPointData } from './bulletPoints';
import { barlow, barlowCondensed } from './fonts';

function DefaultIcon() {
    return <ArrowForward color='darkBlue' />;
}

interface BulletPointProps extends BulletPointData {
    icon?: JSX.Element;
    slotProps?: {
        root?: StackProps;
        title?: TypographyProps;
    };
}

export function BulletPoint({
    title,
    description,
    icon = <DefaultIcon />,
    slotProps,
}: BulletPointProps) {
    return (
        <Stack direction='row' gap={1.5} {...slotProps?.root}>
            {icon}

            <Stack gap={0.75}>
                <Typography
                    sx={{
                        textTransform: 'uppercase',
                        fontFamily: barlowCondensed.style.fontFamily,
                        fontWeight: '600',
                        fontSize: '1.375rem',
                        letterSpacing: '2%',
                        lineHeight: 1,
                    }}
                    {...slotProps?.title}
                >
                    {title}
                </Typography>

                {description && (
                    <Typography
                        sx={{
                            fontFamily: barlow.style.fontFamily,
                            fontSize: '1.1875rem',
                            lineHeight: '1.9375rem',
                        }}
                    >
                        {description}
                    </Typography>
                )}
            </Stack>
        </Stack>
    );
}
