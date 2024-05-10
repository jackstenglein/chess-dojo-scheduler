import { Box, Typography } from '@mui/material';
import React from 'react';
import { ExamType } from '../../database/exam';

interface InstructionsProps {
    length: number;
    timeLimitSeconds: number;
    type?: ExamType;
}

/**
 * Renders instructions based on the given ExamType.
 */
const Instructions: React.FC<InstructionsProps> = ({ type, ...props }) => {
    switch (type) {
        case ExamType.Tactics:
            return <TacticsInstructions {...props} />;
        case ExamType.Polgar:
            return <PolgarMateInstructions {...props} />;
    }

    return (
        <Typography color='error'>
            Unknown Exam Type. Add new ExamType to Instructions component
        </Typography>
    );
};

export default Instructions;

/**
 * Renders instructions for tactics exams.
 */
export const TacticsInstructions: React.FC<InstructionsProps> = ({
    length,
    timeLimitSeconds,
}) => {
    return (
        <>
            <Typography variant='h4' mt={4}>
                Instructions
            </Typography>
            <Typography component='div'>
                <Box component='ul' sx={{ m: 0, '& li': { mt: 1 } }}>
                    <li>
                        Unlike most online tactics trainers, you play both your moves and
                        your opponent's. You will not receive feedback on any moves until
                        the test is fully complete.
                    </li>
                    <li>
                        Points are awarded based on how many critical moves you find. A
                        single problem may have multiple variations for your opponent, so
                        make sure to look for different defenses and respond against each
                        of them. It's up to you to decide which variations are critical
                        and how deep to continue each variation.
                    </li>
                    <li>
                        In each variation, only your main move will be counted as part of
                        your solution. You can promote variations to select which moves
                        will be included in your solution.
                    </li>
                    <li>
                        Not every problem has a tactical solution. In this case, just play
                        a move that improves your position in some way.
                    </li>
                    <li>
                        For each problem, the board will be oriented with the side to move
                        on the bottom. The side to move will also be displayed in the list
                        of problems.
                    </li>
                    <li>
                        The PGN editor is available for you to add comments or annotations
                        if this helps you think, but you are not graded on these. You are
                        graded solely on which moves are present in your final PGN.
                    </li>
                    <li>
                        You can right-click in the list of problems to mark them as
                        complete or needs review. This is purely an organizational tool
                        for you to use as you take the test. You grade will not be based
                        on which problems have which status.
                    </li>
                    <li>
                        You will have {Math.round(timeLimitSeconds / 60)} minutes for{' '}
                        {length} positions. Some problems may be harder than others. You
                        can split the time up among the positions however you choose. You
                        can also return to positions you previously worked on to update
                        your answers.
                    </li>
                    <li>
                        The test ends when your time runs out or when you click the
                        "Finish Early" button.
                    </li>
                    <li>
                        Once the test starts, do not refresh or navigate away from the
                        page. Your progress will be lost if you do so.
                    </li>
                </Box>
            </Typography>
        </>
    );
};

/**
 * Renders instructions for Polgar mate exams.
 */
export const PolgarMateInstructions: React.FC<InstructionsProps> = ({
    timeLimitSeconds,
    length,
}) => {
    return (
        <>
            <Typography variant='h4' mt={4}>
                Instructions
            </Typography>
            <Typography component='div'>
                <Box component='ul' sx={{ m: 0, '& li': { mt: 1 } }}>
                    <li>
                        Unlike most online tactics trainers, you play both your moves and
                        your opponent's. You will not receive feedback on any moves until
                        the test is fully complete.
                    </li>
                    <li>
                        Points are awarded based on how many correct moves you find. A
                        single problem may have multiple variations for your opponent, so
                        make sure to look for different defenses and respond against each
                        of them.
                    </li>
                    <li>
                        <strong>There are no takebacks</strong>, so make sure you've
                        calculated to mate for all defenses before you play your first
                        move.
                    </li>
                    <li>
                        For each problem, the board will be oriented with the side to move
                        on the bottom. The side to move will also be displayed in the list
                        of problems.
                    </li>
                    <li>
                        The PGN editor is available for you to add comments or annotations
                        if this helps you think, but you are not graded on these. You are
                        graded solely on which moves are present in your final PGN.
                    </li>
                    <li>
                        You can right-click in the list of problems to mark them as
                        complete or needs review. This is purely an organizational tool
                        for you to use as you take the test. You grade will not be based
                        on which problems have which status.
                    </li>
                    <li>
                        You will have {Math.round(timeLimitSeconds / 60)} minutes for{' '}
                        {length} positions. Some problems may be harder than others. You
                        can split the time up among the positions however you choose. You
                        can also return to positions you previously worked on to update
                        your answers.
                    </li>
                    <li>
                        The test ends when your time runs out or when you click the
                        "Finish Early" button.
                    </li>
                    <li>
                        Once the test starts, do not refresh or navigate away from the
                        page. Your progress will be lost if you do so.
                    </li>
                </Box>
            </Typography>
        </>
    );
};
