import { Gauge, gaugeClasses } from '@mui/x-charts';
import * as React from 'react';

interface MeterProps {
    value: number;
    wdith: number;
    height: number;
    text: string;
    color: string;
}

const MeterGauge: React.FC<MeterProps> = ({ value, wdith, height, text, color }) => {
    return (
        <Gauge
            width={wdith}
            height={height}
            value={value}
            text={text}
            valueMin={0}
            valueMax={2700}
            sx={(theme) => ({
                [`& .${gaugeClasses.valueText}`]: {
                    fontSize: 20,
                },
                [`& .${gaugeClasses.valueArc}`]: {
                    fill: color,
                },
                [`& .${gaugeClasses.referenceArc}`]: {
                    fill: theme.palette.text.disabled,
                },
            })}
        />
    );
};

export default MeterGauge;
