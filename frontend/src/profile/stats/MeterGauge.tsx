import * as React from 'react';
import {
  GaugeContainer,
  GaugeValueArc,
  GaugeReferenceArc,
  useGaugeState,
} from '@mui/x-charts/Gauge';

function GaugePointer() {
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
      <circle cx={cx} cy={cy} r={5} fill="#FFA500" />
      <path
        d={`M ${cx} ${cy} L ${target.x} ${target.y}`}
        stroke="#FFA500"
        strokeWidth={3}
      />
    </g>
  );
}

interface MeterProps {
  value: number;
  wdith: number;
  height: number;
}

const MeterGauge: React.FC<MeterProps> = ({ value, wdith, height }) => {
  return (
    <GaugeContainer
      width={wdith}
      height={height}
      startAngle={-110}
      endAngle={110}
      valueMin={0}
      valueMax={2700}
      value={value}
      
      
    >
      <GaugeReferenceArc />
      <GaugeValueArc />
      <GaugePointer />
    </GaugeContainer>
  );
};

export default MeterGauge;

