import { Gauge, gaugeClasses } from '@mui/x-charts';
import * as React from 'react';

/**
 * MeterProps interface to provide prop to MeterGauge Compontent
 */

interface MeterProps {
    value: number; // The meter value
    width: number; // The meter width
    height: number; // The meter height
    text: string; // The meter inner text
    color: string; // The meter color
}

/**
 * Compontent to render Meter for given meterProps props
 * @param MeterProps interface
 * @returns UI Compontent for meter display
 */

const MeterGauge: React.FC<MeterProps> = ({ value, width, height, text, color }) => {
    return (
        <Gauge
            width={width}
            height={height}
            value={value}
            text={text}
            valueMin={0}
            valueMax={2900}
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
