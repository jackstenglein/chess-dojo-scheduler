import { ChartsReferenceLine } from '@mui/x-charts';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { LineChart, LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import * as React from 'react';

/**
 * Exam Vals interface to act as prop parameters for ExamGraph compontent
 */

interface ExamVals {
    polgarData: number[]; // checkmate tests ratings list
    tacData: number[]; // tactics test ratings list
    endgameData: number[]; // endgame test ratings list
    checkProvLine: number[]; // overall rating list
    xLabels: string[]; // X-axis label which is timestamp for users' tests
    width: number; // Width of the ExamGraph frame
    height: number; // height of the ExamGraph frame
    realRating: number; // the overall tactics rating of the user
    isUserProv: boolean; // user's tactics rating provisional value
}

/**
 * A Compontent to render user's tactics rating graph
 * @param ExamVals interface
 * @returns UI Compontent to render user's tactics rating graph
 */

const ExamGraph: React.FC<ExamVals> = ({
    polgarData,
    tacData,
    endgameData,
    xLabels,
    width,
    height,
    realRating,
    isUserProv,
    checkProvLine,
}) => {
    return (
        <LineChart
            width={width}
            height={height}
            series={[
                { data: polgarData, label: 'Checkmate', color: '#8c03fc', type: 'line' },
                { data: tacData, label: 'Tactics', color: '#038cfc', type: 'line' },
                { data: endgameData, label: 'Endgame', color: '#f29c4b', type: 'line' },
                {
                    data: checkProvLine,
                    label: 'Overal Rating',
                    color: '#37e691',
                    type: 'line',
                },
            ]}
            xAxis={[{ scaleType: 'point', data: xLabels }]}
            grid={{ vertical: true, horizontal: true }}
        >
            <LinePlot />
            <MarkPlot />
            {isUserProv ? null : (
                <ChartsReferenceLine y={realRating} lineStyle={{ stroke: '#37e691' }} />
            )}

            <ChartsXAxis />
            <ChartsYAxis />
        </LineChart>
    );
};

export default ExamGraph;
