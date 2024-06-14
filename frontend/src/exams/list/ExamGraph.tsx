import { LineChart } from '@mui/x-charts/LineChart';
import * as React from 'react';

interface ExamVals {
    polgarData: number[];
    tacData: number[];
    endgameData: number[];
    pr5min: number[];
    prsuv: number[];
    xLabels: string[];
    width: number;
    height: number;
}

const ExamGraph: React.FC<ExamVals> = ({
    polgarData,
    tacData,
    endgameData,
    pr5min,
    prsuv,
    xLabels,
    width,
    height,
}) => {
    return (
        <LineChart
            width={width}
            height={height}
            series={[
                { data: polgarData, label: 'Checkmate', color: '#8c03fc' },
                { data: tacData, label: 'Tactics', color: '#038cfc' },
                { data: endgameData, label: 'Endgame', color: '#76d404' },
                { data: pr5min, label: 'PR 5 Min', color: '#c9f03c' },
                { data: prsuv, label: 'PR Survival', color: '#ab3cf0' },
            ]}
            xAxis={[{ scaleType: 'point', data: xLabels }]}
        />
    );
};

export default ExamGraph;
