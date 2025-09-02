import { Card, CardContent, Typography } from '@mui/material';
import { ReactNode } from 'react';

const ChatBubble = ({ children }: { children: ReactNode }) => {
    return (
        <Card
            variant='outlined'
            sx={{
                marginBottom: 2.5,
                fontSize: '1.1em',
                borderRadius: '1rem',
                position: 'relative',
                minHeight: 0,
                overflow: 'visible',

                '&:after': {
                    position: 'absolute',
                    content: "''",
                    bottom: '-8.3px',
                    right: '20%',
                    width: '15px',
                    height: '15px',
                    borderRight: '1px solid',
                    borderBottom: '1.5px solid',
                    transform: 'skew(45deg) rotate(45deg)',
                    zIndex: 1,
                    backgroundColor: 'inherit',
                    borderColor: 'inherit',
                },
            }}
        >
            <CardContent>
                <Typography sx={{}}>{children}</Typography>
            </CardContent>
        </Card>
    );
};

export default ChatBubble;
