import React, { useState, useEffect } from 'react';
import VideoCards from './VideoCards';
import { dojoCohorts } from '@/database/user';
import Papa from 'papaparse';

const csvFilePath = '/dojoVods.csv';

const allTags = [
  'Opening',
  'Tactics',
  'Middlegame',
  'Endgame',
  'Dojo Talks',
  'Book Review',
  'Sensei Tips',
];

const DojoVods: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const loadVideosFromCsv = async (filePath: string) => {
      return new Promise<Video[]>((resolve, reject) => {
        Papa.parse(filePath, {
          download: true,
          header: true,
          complete: (results) => {
            const videos: Video[] = results.data.map((row: any) => ({
              url: row.url,
              tags: row.tags.split(',').map((tag: string) => tag.trim()),
              cohorts: row.cohorts.split(',').map((cohort: string) => cohort.trim())
            }));
            resolve(videos);
          },
          error: (error) => {
            reject(error);
          }
        });
      });
    };

    const fetchVideos = async () => {
      try {
        const loadedVideos = await loadVideosFromCsv(csvFilePath);
        setVideos(loadedVideos);
      } catch (error) {
        console.error('Error loading CSV file:', error);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <VideoCards videos={videos} allTags={allTags} allCohorts={dojoCohorts} />
    </div>
  );
};

export default DojoVods;

