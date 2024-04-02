import { Color, TrainingReducer } from '@bendk/chess-tree'
import React, { useEffect, useRef } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

export interface FeedbackIconProps {
    color: Color;
    feedback: TrainingReducer.TrainingBoardFeedback;
}

const FeedbackIcon: React.FC<FeedbackIconProps> = ({color, feedback}) => {
    const ref = useRef<SVGSVGElement|null>(null)
    const file = (color === 'w') ? feedback.file : 7 - feedback.file
    const rank = (color === 'w') ? feedback.rank : 7 - feedback.rank
    const sx = {
        color: (feedback.type === "correct") ? "#0f3" : "#f30",
        position: "absolute",
        zIndex: "300",
        left: `${file * 12.5}%`,
        bottom: `${rank * 12.5}%`,
        width: "12.5%",
        height: "12.5%",
    }

    useEffect(() => {
        if(ref.current) {
            const elt = ref.current
            elt.style.transition = ""
            elt.style.opacity = "1"
            elt.style.visibility = "visible"
            setTimeout(() => {
                elt.style.transition = "all 0.9s ease-in"
                elt.style.opacity = "0"
                elt.style.visibility = "hidden"
            }, 100)
        }
    })

    if (feedback.type === "correct") {
        return <CheckIcon ref={ref} sx={sx} />
    } else {
        return <CloseIcon ref={ref} sx={sx} /> 
    }
}

export default FeedbackIcon
