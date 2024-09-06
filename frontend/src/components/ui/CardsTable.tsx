import { Card, CardActionArea, CardContent, Grid2 } from '@mui/material';
import { ReactNode } from 'react';

interface CardProps<T> {
    id: string | number;
    data: T;
}

interface CardsTableProps<T> {
    card: (props: CardProps<T>) => ReactNode;
    childProps: CardProps<T>[];
    onClick: (props: CardProps<T>) => void;
}

export default function CardsTable<T>({ card, childProps, onClick }: CardsTableProps<T>) {
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
