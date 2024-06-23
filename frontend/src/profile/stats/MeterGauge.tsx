import { Box, Stack, Typography } from '@mui/material';
import { Gauge, gaugeClasses, useGaugeState } from '@mui/x-charts/Gauge';
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
    userMaxValue: number;
    

}

interface GaugePointerProps {
    color: string;
  }
  
  const GaugePointer: React.FC<GaugePointerProps> = ({ color }) => {
    const { valueAngle, outerRadius, cx, cy } = useGaugeState();
  
    if (valueAngle === null) {
      // No value to display
      return null;
    }
  
    const target = {
      x: cx + outerRadius * Math.sin(valueAngle),
      y: cy - outerRadius * Math.cos(valueAngle),
    };
  
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="red" />
        <path
          d={`M ${cx} ${cy} L ${target.x} ${target.y}`}
          stroke={color}
          strokeWidth={3}
        />
      </g>
    );
  };

/**
 * Compontent to render Meter for given meterProps props
 * @param MeterProps interface
 * @returns UI Compontent for meter display
 */

const MeterGauge: React.FC<MeterProps> = ({ value, width, height, text, color, userMaxValue }) => {
    return (
        <Box>
            <Stack>
                <Typography
                    align='center'
                    variant='h6'
                    color={'primary'}
                    sx={{
                        fontWeight: 'bold',
                    }}
                >
                    {' '}
                    {text}{' '}
                </Typography>
                <Gauge
                    width={width}
                    height={height}
                    value={value}
                    valueMin={0}
                    valueMax={userMaxValue}
                    startAngle={-100}
                    endAngle={100}
                    text={''}
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
                >
                    <GaugePointer color={color}/>
                </Gauge>
            </Stack>
        </Box>
    );
};

export default MeterGauge;
