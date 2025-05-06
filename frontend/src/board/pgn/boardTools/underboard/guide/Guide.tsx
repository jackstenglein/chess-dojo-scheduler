import { Box, Link, Typography } from '@mui/material';

const GuideLinks = () => {
    return (
        <Box sx={{ p: 3, maxWidth: 400 }} >
            <Typography variant='h6' gutterBottom>
                Explore More Resources on Game analysis
            </Typography>
            <Typography variant='body2' gutterBottom>
                Here is a  helpful links to get you started:
            </Typography>
            <Box sx={{ mt: 1 }}>
                <Link
                    href='https://player.vimeo.com/video/694563485e'
                    target='_blank'
                    rel='noopener'
                    underline='hover'
                    display='block'
                    mb={1}
                >
                    How to analyze your game
                </Link>
                {/* <Link
                    href='https..'
                    target='_blank'
                    rel='noopener'
                    underline='hover'
                    display='block'
                >
                    How to use the games editor
                </Link> */}
            </Box>
        </Box>
    );
};

export default GuideLinks;
