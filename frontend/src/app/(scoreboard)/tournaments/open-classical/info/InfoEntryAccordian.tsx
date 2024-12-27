import Icon, { IconName } from '@/style/Icon';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Link,
    List,
    ListItem,
    Stack,
    Typography,
} from '@mui/material';

interface infoEntry {
    id: string;
    iconid: IconName;
    title: string;
    desc: string;
}

interface InfoEntryProps extends infoEntry {
    isList?: boolean;
    isButton?: boolean;
    decList?: string[];
    buttonName?: string;
    endpoint?: string;
}

export const InfoEntryAccordion: React.FC<InfoEntryProps> = ({
    id,
    iconid,
    title,
    desc,
    isList = false,
    isButton = false,
    decList = [],
    buttonName,
    endpoint,
}) => {
    return (
        <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} id={id}>
                <Typography variant='h6' color='text.secondary'>
                    <Icon
                        name={iconid}
                        sx={{ mr: 1, verticalAlign: 'middle' }}
                        color='dojoOrange'
                    />
                    {title}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                {isList && decList.length > 0 ? (
                    <List>
                        {decList.map((item, index) => (
                            <ListItem key={index} sx={{ paddingLeft: 0 }}>
                                <Typography>{item}</Typography>
                            </ListItem>
                        ))}
                        <Typography>{desc}</Typography>
                    </List>
                ) : (
                    <Typography>{desc}</Typography>
                )}

                {isButton && buttonName && endpoint && (
                    <Stack
                        direction='row'
                        spacing={2}
                        justifyContent='center'
                        sx={{ mt: 3 }}
                    >
                        <Button
                            variant='contained'
                            color='success'
                            component={Link}
                            href={endpoint}
                        >
                            {buttonName}
                        </Button>
                    </Stack>
                )}
            </AccordionDetails>
        </Accordion>
    );
};
