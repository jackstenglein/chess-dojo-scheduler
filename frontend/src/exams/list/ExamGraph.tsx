import { ChartsReferenceLine } from '@mui/x-charts';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { LineChart, LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import * as React from 'react';

/**
 * Exam Vals interface to act as prop parameters for ExamGraph compontent
 */

interface ExamVals {
    data: number[];
    xLabels: string[];
    width: number;
    height: number;
    label: string;
    color: string;
    isUserProv: boolean; // user's tactics rating provisional value
    checkProvLine: number[]; // overall rating list
    realRating: number;
    isPR: boolean;
}

/**
 * A Compontent to render user's tactics rating graph
 * @param ExamVals interface
 * @returns UI Compontent to render user's tactics rating graph
 */

const ExamGraph: React.FC<ExamVals> = ({
    data,
    xLabels,
    width,
    height,
    label,
    color,
    isUserProv,
    checkProvLine,
    realRating,
    isPR,
}) => {
    const colorLabel = !isPR ? '' : !isUserProv ? '' : '#37e691';
    const displayLabel = !isPR? '': !isUserProv ? '' : 'Overall Rating';
    const lineType = !isPR? undefined : !isUserProv ? undefined: 'line';
    return (
        <LineChart
            width={width}
            height={height}
            series={[
                {
                    data: data,
                    label: label,
                    color: color,
                    type: 'line',
                    valueFormatter: (v) => new Number(v).toString()
                },
                {
                    data: checkProvLine,
                    label: displayLabel,
                    color: colorLabel,
                    type: lineType,
                    valueFormatter: (v) => new Number(v).toString()
                },
            ]}
            // series={[
            //     { data: polgarData, label: 'Checkmate', color: '#5905a3', type: 'line'},
            //     { data: tacData, label: 'Tactics', color: '#55d444', type: 'line' },
            //     { data: pr5min, label: 'PR 5 Min', color: '#2803a1', type: 'line' },
            //     {data: prSuv, label: 'PR Survival', color: '#e01eeb', type: 'line'},
            //     {
            //         data: checkProvLine,
            //         label: 'Overall',
            //         color: '#37e691',
            //         type: 'line',
            //     },
            // ]}
            xAxis={[{ scaleType: 'point', data: xLabels }]}
            grid={{ vertical: true, horizontal: true }}
            yAxis={
                [
                    {
                        valueFormatter: (number) => new Number(number).toString() 
                    }
                ]
            }
        >
            <LinePlot />
            <MarkPlot />
            {
                !isPR ? null : (
                    !isUserProv ? null : (
                        <ChartsReferenceLine y={realRating} lineStyle={{ stroke: '#37e691' }} />
                    )
                )
            }
            
            <ChartsXAxis />
            <ChartsYAxis />
        </LineChart>
    );
};

export default ExamGraph;
