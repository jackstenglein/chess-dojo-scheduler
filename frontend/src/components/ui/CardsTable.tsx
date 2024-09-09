import { Card, CardActionArea, CardContent, Grid2 } from '@mui/material';

interface HasId {
    id: string | number;
}

interface CardsTableProps<T extends HasId> {
    card: (props: T) => React.ReactNode;
    childProps: T[];
    onClick: (props: T) => void;
}

export default function CardsTable<T extends HasId>({
    card,
    childProps,
    onClick,
}: CardsTableProps<T>) {
    return (
        <Grid2>
            {childProps.map((props) => (
                <Card key={props.id} sx={{ height: 1 }}>
                    <CardActionArea
                        sx={{ height: 1 }}
                        onClick={() => onClick(props)}
                        data-cy={props.id}
                    >
                        <CardContent>{card(props)}</CardContent>
                    </CardActionArea>
                </Card>
            ))}
        </Grid2>
    );
}
