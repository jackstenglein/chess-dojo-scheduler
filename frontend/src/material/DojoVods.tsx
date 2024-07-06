import React from 'react';
import VideoCards from './VideoCards';

const videos = [
    {
        url: 'https://www.youtube.com/watch?v=pJksjHfzo7Q',
        tags: ['Dojo Talks', 'Tactics', 'Sensei Tips'],
    },
    {
        url: 'https://www.youtube.com/watch?v=0nO5edb__9M',
        tags: ['Dojo Talks', 'Sensei Tips'],
    },
    {
        url: 'https://www.youtube.com/watch?v=Deqa8sFnct8',
        tags: ['Opening', 'Sensei Tips'],
    },
    {
        url: 'https://www.youtube.com/watch?v=z0r04qwD54g',
        tags: ['Book Review', 'Sensei Tips'],
    },
    {
        url: 'https://www.youtube.com/watch?v=6riUvCU4aKk',
        tags: ['Opening', 'Sensei Tips'],
    },
    {
        url: 'https://www.youtube.com/watch?v=X1xu3ft3v_4',
        tags: ['Opening', 'Sensei Tips'],
    },
    {
        url: 'https://www.youtube.com/watch?v=BVc86MdiJFM',
        tags: ['Opening', 'Sensei Tips'],
    },
    {
        url: 'https://www.youtube.com/watch?v=tuKYgi7agic',
        tags: ['Sensei Tips', 'Tactics'],
    },
    {
        url: 'https://www.youtube.com/watch?v=99KwvBOiQyU',
        tags: ['Sensei Tips', 'Tactics'],
    },
    {
        url: 'https://www.youtube.com/watch?v=olz_y0CcjFA',
        tags: ['Sensei Tips', 'Middlegame'],
    },
    {
        url: 'https://www.youtube.com/watch?v=hsGux3-xRD8',
        tags: ['Sensei Tips', 'Middlegame'],
    },
    {
        url: 'https://www.youtube.com/watch?v=xwdige8YcOc',
        tags: ['Sensei Tips', 'Endgame'],
    },
    {
        url: 'https://www.youtube.com/watch?v=SOxSdYm0hDU',
        tags: ['Sensei Tips', 'Endgame'],
    },
    {
        url: 'https://www.youtube.com/watch?v=rLRIVPGRVxE',
        tags: ['Sensei Tips', 'Endgame'],
    },
    {
        url: 'https://www.youtube.com/watch?v=PcYZt5Aqf3E',
        tags: ['Sensei Tips', 'Book Review'],
    },
    {
        url: 'https://www.youtube.com/watch?v=FEDWBgVNJYI',
        tags: ['Sensei Tips', 'Book Review'],
    },
    
    
    // Add more video objects here
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
            <VideoCards videos={videos} allTags={allTags} />
        </div>
    );
};

export default DojoVods;
