import React from 'react'
import { now } from 'lodash'
import { TrainingActivity } from '@bendk/chess-tree'
import { Typography } from '@mui/material';
import { DataGridPro, GridColDef, GridRenderCellParams } from '@mui/x-data-grid-pro';
import { updateActivityTimestamp } from '../api/bookApi'

export interface ActivityProps {
    activity: TrainingActivity[],
}

const Activity: React.FC<ActivityProps> = ({activity}) => {
    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
        },
        {
            field: 'moves',
            headerName: 'Moves',
            minWidth: 100,
        },
        {
            field: 'accuracy',
            headerName: 'Accuracy',
            minWidth: 150,
            renderCell: (params: GridRenderCellParams<any, number>) => {
                let color
                let value = params.value ?? 0
                if (value > 90) {
                    color = "#33ff44"
                } else if (value > 75) {
                    color = "#e8ff33"
                } else {
                    color = "#ff3333"
                }
                return <Typography color={color}> {value}%</Typography>
            }
        },
        {
            field: 'when',
            headerName: 'When',
            minWidth: 150,
        },
    ];

    const currentTimestamp = now()
    const rows = activity.map(activity => {
        const totalCount = activity.correctCount + activity.incorrectCount
        const accuracy = (totalCount > 0) ? Math.round(activity.correctCount * 100 / totalCount) : 0
        return {
            id: activity.timestamp,
            name: activity.name,
            moves: totalCount,
            accuracy,
            when: calcTimeSince(activity, currentTimestamp)
        }
    })

    function calcTimeSince(activity: TrainingActivity, currentTimestamp: number): string {
        // Do some basic checking that the activity doesn't have a future timestamp because it was
        // stored by a client with a weird clock
        if (activity.timestamp > currentTimestamp) {
            updateActivityTimestamp('test-user', activity, currentTimestamp)
            activity.timestamp = currentTimestamp
        }
        const seconds = (currentTimestamp - activity.timestamp) / 1000
        const table: [number, string, string][] = [
            [604800, "week", "weeks"],
            [86400, "day", "days"],
            [3600, "hour", "hours"],
            [60, "minute", "minutes"]
        ]

        for(const [amount, singular, plural] of table) {
            if (seconds >= amount) {
                const count = Math.round(seconds / amount)
                if (count === 1) {
                    return `${count} ${singular} ago`
                } else {
                    return `${count} ${plural} ago`
                }
            }
        }
        return "now"
    }

    return <DataGridPro
        columns={columns}
        rows={rows}
        disableColumnResize={true}
        disableColumnReorder={true}
        disableColumnMenu={true}
        hideFooter={true}
    />
};

export default Activity;
