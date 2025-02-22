import { Chip, Stack } from '@mui/material';

export enum TrainingPlanView {
    Daily = 'DAILY',
    Weekly = 'WEEKLY',
    Full = 'FULL',
}

/** Renders a list of buttons used to select the training plan view. */
export function TrainingPlanViewSelect({
    value,
    onChange,
}: {
    /** The selected value. */
    value: TrainingPlanView;
    /** A callback invoked when the user changes the value. */
    onChange: (value: TrainingPlanView) => void;
}) {
    return (
        <Stack direction='row' gap={1}>
            <Chip
                label='Daily'
                color='secondary'
                variant={value === TrainingPlanView.Daily ? 'filled' : 'outlined'}
                onClick={() => onChange(TrainingPlanView.Daily)}
            />
            <Chip
                label='Weekly'
                color='secondary'
                variant={value === TrainingPlanView.Weekly ? 'filled' : 'outlined'}
                onClick={() => onChange(TrainingPlanView.Weekly)}
            />
            <Chip
                label='Full Training Plan'
                color='secondary'
                variant={value === TrainingPlanView.Full ? 'filled' : 'outlined'}
                onClick={() => onChange(TrainingPlanView.Full)}
            />
        </Stack>
    );
}
