import { BarChart } from '@mui/x-charts/BarChart';
import * as React from 'react';


/**
 * This compontent represents a Bar Graph
 */

interface BarGraphProps {
    width: number;
    height: number;
    tacRating: number;
    pr5Rating: number;
    prsuRating: number;
    checkRating: number;
    progressColors: string[]
}


const BarGraph: React.FC<BarGraphProps> = ({width, height, tacRating, progressColors, pr5Rating, prsuRating, checkRating}) => {
    const data =[tacRating, checkRating, pr5Rating, prsuRating];
    console.log(data);
    return (
        <BarChart
            xAxis={[
                {
                    id: 'barCategories',
                    data: ['Tactics', 'Checkmate', 'PR 5 Min', 'PR Survival'],
                    scaleType: 'band',
                    colorMap: {
                        type: 'ordinal',
                        colors: progressColors,
                      }
                    ,
                    categoryGapRatio: 0.7,
                    barGapRatio: 0.2,
                    label: 'Tactics Rating Component'
                    
                  
                },
                
            ]}

            yAxis={
                [
                    {
                        valueFormatter: (number) => new Number(number).toString() 
                    }
                ]
            }

            series={[
                {
                    data: data,
                    valueFormatter: (v) => new Number(v).toString()
                },
            ]}

            
            
            width={width}
            height={height}
        />
    );
};

export default BarGraph;
