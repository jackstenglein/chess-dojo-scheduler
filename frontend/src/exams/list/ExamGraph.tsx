import { ChartsReferenceLine } from '@mui/x-charts';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import {
    LineChart,
    lineElementClasses,
    markElementClasses,
    MarkPlot
  } from '@mui/x-charts/LineChart';
import { readFile } from 'fs';
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
    realRating: number;
    displayDiffText: string;
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
    realRating,
    displayDiffText
}) => {

    const convertToString = data.map((n) => parseInt(n.toString()));
    const convertTimeline = xLabels.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const getAvgShower = data.length <= 1 ? [] : [realRating];
    return (
        <LineChart
            width={width}
            height={height}
            sx={{
                [`.${lineElementClasses.root}, .${markElementClasses.root}`]: {
                  strokeWidth: 1,
                },
                '.MuiLineElement-series-pvId': {
                  strokeDasharray: '5 5',
                },
                '.MuiLineElement-series-uvId': {
                  strokeDasharray: '3 4 5 2',
                },
                [`.${markElementClasses.root}:not(.${markElementClasses.highlighted})`]: {
                  fill: '#fff',
                },
                [`& .${markElementClasses.highlighted}`]: {
                  stroke: 'none',
                },
              }}
            series={[
                
                {
                    data: convertToString,
                    label: label,
                    color: color,
                    type: 'line',
                    valueFormatter: (v) => new Number(v).toString(),
                    
                },
                {
                    data: getAvgShower,
                    label: displayDiffText,
                    color: '#37e691',
                    type: 'line',
                    valueFormatter: (v) => new Number(v).toString()
                },
            ]}
            xAxis={[{ scaleType: 'point', data: convertTimeline }]}
            grid={{ vertical: true, horizontal: true }}
            yAxis={
                [
                    {
                        valueFormatter: (number) => new Number(number).toString() 
                    }
                ]
            }
        >
          
            <MarkPlot />
            {
                    data.length <= 1 ? null : (
                        <ChartsReferenceLine y={realRating} lineStyle={{ stroke: '#37e691' }}  />
                        
                    )   
            }
            <ChartsXAxis />
            <ChartsYAxis />
        </LineChart>
    );
};

export default ExamGraph;
