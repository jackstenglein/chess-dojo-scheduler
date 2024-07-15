import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Grid, Select, MenuItem, InputLabel, FormControl, Box, Dialog, DialogContent, Chip, ListItemText } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import CohortIcon from '@/scoreboard/CohortIcon';

interface Video {
  url: string;
  tags: string[];
  cohorts: string[];
}

interface VideoCardsProps {
  videos: Video[];
  allTags: string[];
  allCohorts: string[];
}

const VideoCards: React.FC<VideoCardsProps> = ({ videos, allTags, allCohorts }) => {
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [expandedVideo, setExpandedVideo] = useState<Video | null>(null);

  const handleTagChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTag(event.target.value as string);
  };

  const handleCohortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCohort(event.target.value as string);
  };

  const handleCardClick = (video: Video) => {
    setExpandedVideo(video);
  };

  const handleClose = () => {
    setExpandedVideo(null);
  };

  const filteredVideos = videos.filter((video) => {
    const matchesTag = selectedTag ? video.tags.includes(selectedTag) : true;
    const matchesCohort = selectedCohort ? video.cohorts.includes(selectedCohort) : true;
    return matchesTag && matchesCohort;
  });

  return (
    <Box>
      <Typography variant="h3" align="center" gutterBottom>
        ChessDojo Vods
      </Typography>
      <Typography variant="body1" align="center" paragraph>
        Explore a curated selection of ChessDojo videos, handicked by Sensei to provide you with supplementary video learning which can be filtered by tags and cohorts.
      </Typography>

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

      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="cohort-select-label">Select Cohort</InputLabel>
        <Select
          labelId="cohort-select-label"
          value={selectedCohort}
          onChange={handleCohortChange}
          label="Select Cohort"
          renderValue={() => ''}
        >
          <MenuItem value="">
            <AllInclusiveIcon fontSize="small" style={{ marginRight: 6 }} color='primary' />
            <ListItemText primary={<em>All</em>} />
          </MenuItem>
          {allCohorts.map((cohort) => (
            <MenuItem key={cohort} value={cohort}>
              <CohortIcon cohort={cohort} size={25} sx={{ marginRight: 6 }}/>
              <ListItemText primary={cohort}/>
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
                <Typography variant="h6">Tags</Typography>
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
                <Typography variant="h6" style={{ marginTop: '1rem' }}>Cohorts</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {video.cohorts.map((cohort, cohortIndex) => (
                    <Chip
                      key={cohortIndex}
                      icon={<CohortIcon cohort={cohort} size={25}/>}
                      label={cohort}
                      variant="outlined"
                      color="secondary"
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
                <Typography variant="body1">Tags</Typography>
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
                <Typography variant="body1" style={{ marginTop: '1rem' }}>Cohorts</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {expandedVideo.cohorts.map((cohort, cohortIndex) => (
                    <Chip
                      key={cohortIndex}
                      icon={<CohortIcon cohort={cohort} size={25}/>}
                      label={cohort}
                      variant="outlined"
                      color="secondary"
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





