import { BarChart } from '@mui/x-charts/BarChart';
import * as React from 'react';


interface BarGraphProps {
    width: number;
    height: number;
    tacRating: number;
    posRating: number;
    endRating: number;
    opRating: number;
    pr5Rating: number;
    prsuRating: number;
    checkRating: number;
    progressColors: string[]
}


const BarGraph: React.FC<BarGraphProps> = ({width, height, tacRating, endRating, posRating, opRating, progressColors, pr5Rating, prsuRating, checkRating}) => {
    return (
        <BarChart
            xAxis={[
                {
                    id: 'barCategories',
                    data: ['Tactics', 'Positional', 'Endgame', 'Opening', 'Checkmate', 'PR 5 Min', 'PR Survival'],
                    scaleType: 'band',
                    colorMap: {
                        type: 'ordinal',
                        colors: progressColors,
                      }
                    ,
                    min: 0,
                    max: 2900,
                    categoryGapRatio: 0.7,
                    barGapRatio: 0.2,
                    label: 'Tactics Rating Component'
                  
                },
                
            ]}
            series={[
                {
                    data: [tacRating, posRating, endRating, opRating, checkRating, pr5Rating, prsuRating],
                   
                },
            ]}
            
            width={width}
            height={height}
        />
    );
};

export default BarGraph;
