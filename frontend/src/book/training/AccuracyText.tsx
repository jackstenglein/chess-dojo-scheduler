import React from 'react'
import { Typography } from '@mui/material';

interface AccuracyTextProps {
    correctCount: number;
    incorrectCount: number;
}

const AccuracyText: React.FC<AccuracyTextProps> = ({correctCount, incorrectCount}) => {
    const totalCount = (correctCount + incorrectCount)
    const value = (totalCount > 0) ? Math.round(correctCount * 100 / totalCount) : 0
    let color = "#ff3333"
    if (value > 90) {
        color = "#33ff44"
    } else if (value > 75) {
        color = "#e8ff33"
    }

    return <Typography color={color}>{value}%</Typography>
}

export default AccuracyText
