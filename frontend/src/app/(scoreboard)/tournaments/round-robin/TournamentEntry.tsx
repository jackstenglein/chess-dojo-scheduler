import CohortIcon from '@/scoreboard/CohortIcon';
import { PawnIcon } from '@/style/ChessIcons';
import Icon from '@/style/Icon';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { Typography } from '@mui/material';
import { CalendarIcon } from '@mui/x-date-pickers';
import React from 'react';

export interface RoundRobinEntry {
    cohort: string;
    entryName: string;
    pannelName: string;
    waiting: boolean;
    startdate: Date;
    enddate: Date;
    playerCount: number;
    gameCount: number;
    tc: number;
    inc: number;
}

function getDisplayDate(date: Date) {
    return new Date(date).toISOString().split('T')[0];
}

export const TournamentEntry: React.FC<RoundRobinEntry> = ({
    cohort,
    waiting,
    startdate,
    enddate,
    playerCount,
    gameCount,
    entryName,
    pannelName,
    tc,
    inc,
}) => {
    return (
        <Typography variant='h6' textAlign={'center'}>
            <CohortIcon
                cohort={cohort}
                sx={{
                    marginRight: '0.6em',
                    verticalAlign: 'middle',
                }}
                tooltip=''
                size={25}
            />{' '}
            {entryName} {pannelName}
            {waiting ? (
                <>
                    <HourglassEmptyIcon
                        sx={{
                            verticalAlign: 'middle',
                            marginLeft: '0.4em',
                        }}
                        color='primary'
                    />
                    <span
                        style={{
                            verticalAlign: 'middle',
                            marginLeft: '0.4em',
                        }}
                    >
                        Waiting
                    </span>
                </>
            ) : (
                <>
                    <AlarmOnIcon
                        sx={{
                            verticalAlign: 'middle',
                            marginLeft: '0.4em',
                        }}
                        color='primary'
                    />
                    <span
                        style={{
                            verticalAlign: 'middle',
                            marginLeft: '0.4em',
                        }}
                    >
                        Active
                    </span>
                </>
            )}
            <>
                <Icon
                    name={'Classical'}
                    sx={{
                        verticalAlign: 'middle',
                        marginLeft: '0.4em',
                    }}
                    color='primary'
                />
                {'>='} {tc} {'+'} {inc} {''}
            </>
            <PeopleAltIcon
                sx={{
                    verticalAlign: 'middle',
                    marginLeft: '0.4em',
                }}
                color='primary'
            />{' '}
            {playerCount} {''}
            <>
                <PawnIcon
                    sx={{
                        verticalAlign: 'middle',
                        marginLeft: '0.4em',
                    }}
                    color='primary'
                />
                <span
                    style={{
                        verticalAlign: 'middle',
                        marginLeft: '0.4em',
                    }}
                >
                    {gameCount}
                </span>
            </>
            <CalendarIcon
                sx={{
                    verticalAlign: 'middle',
                    marginLeft: '0.4em',
                }}
                color='primary'
            />{' '}
            {getDisplayDate(startdate)} - {''}
            {getDisplayDate(enddate)}
        </Typography>
    );
};
