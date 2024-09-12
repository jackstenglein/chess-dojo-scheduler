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
        <Grid2 container spacing={1}>
            {childProps.map((props) => (
                <Grid2 item minWidth='250px' key={props.id}>
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
