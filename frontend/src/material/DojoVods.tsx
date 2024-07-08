import React from 'react';
import VideoCards from './VideoCards';
import { dojoCohorts } from '@/database/user';
const videos = [
    {
        url: 'https://www.youtube.com/watch?v=pJksjHfzo7Q',
        tags: ['Dojo Talks', 'Tactics', 'Sensei Tips'],
        cohorts: ['0-300', '400-500']
    },
    {
        url: 'https://www.youtube.com/watch?v=0nO5edb__9M',
        tags: ['Dojo Talks', 'Sensei Tips'],
        cohorts: ['1200-1300', '1100-1200']
    },
    {
        url: 'https://www.youtube.com/watch?v=Deqa8sFnct8',
        tags: ['Opening', 'Sensei Tips'],
        cohorts: ['1900-2000']
    },
    {
        url: 'https://www.youtube.com/watch?v=z0r04qwD54g',
        tags: ['Book Review', 'Sensei Tips'],
        cohorts: ['1900-2000', '2100-2200']
    },
    {
        url: 'https://www.youtube.com/watch?v=6riUvCU4aKk',
        tags: ['Opening', 'Sensei Tips'],
        cohorts: ['0-300', '300-400']
    },
    {
        url: 'https://www.youtube.com/watch?v=X1xu3ft3v_4',
        tags: ['Opening', 'Sensei Tips'],
        cohorts: ['500-600', '700-800']
    },
    {
        url: 'https://www.youtube.com/watch?v=BVc86MdiJFM',
        tags: ['Opening', 'Sensei Tips'],
        cohorts: ['900-1000']
    },
    {
        url: 'https://www.youtube.com/watch?v=tuKYgi7agic',
        tags: ['Sensei Tips', 'Tactics'],
        cohorts: ['1200-1300', '1300-1400']
    },
    {
        url: 'https://www.youtube.com/watch?v=99KwvBOiQyU',
        tags: ['Sensei Tips', 'Tactics'],
        cohorts: ['300-400']
    },
    {
        url: 'https://www.youtube.com/watch?v=olz_y0CcjFA',
        tags: ['Sensei Tips', 'Middlegame'],
        cohorts: ['0-300', '300-400']
    },
    {
        url: 'https://www.youtube.com/watch?v=hsGux3-xRD8',
        tags: ['Sensei Tips', 'Middlegame'],
        cohorts: ['1300-1400']
    },
    {
        url: 'https://www.youtube.com/watch?v=xwdige8YcOc',
        tags: ['Sensei Tips', 'Endgame'],
        cohorts: ['0-300', '300-400']
    },
    {
        url: 'https://www.youtube.com/watch?v=SOxSdYm0hDU',
        tags: ['Sensei Tips', 'Endgame'],
        cohorts: ['0-300', '300-400']
    },
    {
        url: 'https://www.youtube.com/watch?v=rLRIVPGRVxE',
        tags: ['Sensei Tips', 'Endgame'],
        cohorts: ['0-300', '300-400']
    },
    {
        url: 'https://www.youtube.com/watch?v=PcYZt5Aqf3E',
        tags: ['Sensei Tips', 'Book Review'],
        cohorts: ['0-300', '300-400']
    },
    {
        url: 'https://www.youtube.com/watch?v=FEDWBgVNJYI',
        tags: ['Sensei Tips', 'Book Review'],
        cohorts: ['0-300', '300-400']
    },
    

];

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
    return (
        <div style={{ padding: '20px' }}>
            <VideoCards videos={videos} allTags={allTags} allCohorts={dojoCohorts}/>
        </div>
    );
};

export default DojoVods;
