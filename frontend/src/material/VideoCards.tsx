import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Grid, Select, MenuItem, InputLabel, FormControl, Box, Dialog, DialogContent, Chip, ListItemText } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

interface Video {
  url: string;
  tags: string[];
}

interface VideoCardsProps {
  videos: Video[];
  allTags: string[];
}

const VideoCards: React.FC<VideoCardsProps> = ({ videos, allTags }) => {
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [expandedVideo, setExpandedVideo] = useState<Video | null>(null);

  const handleTagChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTag(event.target.value as string);
  };

  const handleCardClick = (video: Video) => {
    setExpandedVideo(video);
  };

  const handleClose = () => {
    setExpandedVideo(null);
  };

  const filteredVideos = selectedTag
    ? videos.filter((video) => video.tags.includes(selectedTag))
    : videos;

  return (
    <Box>
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="tag-select-label">Select Tag</InputLabel>
        <Select
          labelId="tag-select-label"
          value={selectedTag}
          onChange={handleTagChange}
          label="Select Tag"
          renderValue={() => ''}
        >
          <MenuItem value="">
            <AllInclusiveIcon fontSize="small" style={{ marginRight: 8 }} color='primary' />
            <ListItemText primary={<em>All</em>} />
          </MenuItem>
          {allTags.map((tag) => (
            <MenuItem key={tag} value={tag}>
              <LocalOfferIcon fontSize="small" style={{ marginRight: 8 }} color='primary'/>
              <ListItemText primary={tag} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Grid container spacing={4}>
        {filteredVideos.map((video, index) => (
          <Grid item xs={12} sm={6} md={6} lg={4} key={index}>
            <Card onClick={() => handleCardClick(video)} style={{ cursor: 'pointer' }}>
              <CardMedia
                component="iframe"
                height="300"
                src={`https://www.youtube.com/embed/${new URL(video.url).searchParams.get('v')}`}
                title="YouTube video"
              />
              <CardContent>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {video.tags.map((tag, tagIndex) => (
                    <Chip
                      key={tagIndex}
                      icon={<LocalOfferIcon />}
                      label={tag}
                      variant="outlined"
                      color="primary"
                      size="small"
                      style={{ borderRadius: '16px' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={!!expandedVideo} onClose={handleClose} fullWidth maxWidth="md">
        {expandedVideo && (
          <DialogContent>
            <Card>
              <CardMedia
                component="iframe"
                height="500"
                src={`https://www.youtube.com/embed/${new URL(expandedVideo.url).searchParams.get('v')}`}
                title="YouTube video"
              />
              <CardContent>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {expandedVideo.tags.map((tag, tagIndex) => (
                    <Chip
                      key={tagIndex}
                      icon={<LocalOfferIcon />}
                      label={tag}
                      variant="outlined"
                      color="primary"
                      size="small"
                      style={{ borderRadius: '16px' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
};

export default VideoCards;


