import { Card, CardActionArea, CardContent, Grid2 } from '@mui/material';

interface HasId {
    id: string | number;
}

interface CardGridProps<T extends HasId> {
    card: (props: T) => React.ReactNode;
    childProps: T[];
    onClick: (props: T) => void;
}

export default function CardGrid<T extends HasId>({
    card,
    childProps,
    onClick,
}: CardGridProps<T>) {
    return (
        <Grid2 container spacing={{ xs: 1, md: 3 }} columns={{ xs: 1, sm: 8, md: 12 }}>
            {childProps.map((props) => (
                <Grid2 key={props.id} size={{ xs: 1, sm: 4, md: 4 }}>
                    <Card>
                        <CardActionArea
                            sx={{ height: 1 }}
                            onClick={() => onClick(props)}
                            data-cy={props.id}
                        >
                            <CardContent>{card(props)}</CardContent>
                        </CardActionArea>
                    </Card>
                </Grid2>
            ))}
        </Grid2>
    );
}
