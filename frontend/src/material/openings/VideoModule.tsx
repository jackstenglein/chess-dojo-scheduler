import { Box, Stack, Typography } from '@mui/material';

import { ModuleProps } from './Module';

const VideoModule: React.FC<ModuleProps> = ({ module }) => {
    if (!module.videoUrls) {
        return null;
    }

    return (
        <Stack>
            <Typography variant='h6'>{module.name}</Typography>
            <Typography>{module.description}</Typography>

            {module.videoUrls.map((url, idx) => (
                <Box
                    sx={{
                        width: {
                            xs: 1,
                            sm: 0.7,
                            lg: 0.6,
                        },
                        mt: 1,
                        aspectRatio: '1.77',
                    }}
                    key={url}
                >
                    <iframe
                        src={url}
                        title={`Video ${idx + 1}`}
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share'
                        allowFullScreen={true}
                        style={{ width: '100%', height: '100%' }}
                        frameBorder={0}
                    />
                </Box>
            ))}
        </Stack>
    );
};

export default VideoModule;
