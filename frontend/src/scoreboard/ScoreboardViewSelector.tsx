import { MenuItem, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { dojoCohorts } from '../database/user';

interface ScoreboardViewSelectorProps {
    /** The current value of the view. */
    value: string;

    /**
     * An optional function to call when the view is changed. If not provided,
     * the default is to navigate to the new view.
     */
    onChange?: (value: string) => void;
}

/**
 * A component that allows switching between different scoreboard views.
 * @param value The current value of the view.
 * @param onChange An optional function to call when the view is changed. If not provided, the default is to navigate to the new view.
 * @returns A component that allows switching between different scoreboard views.
 */
const ScoreboardViewSelector: React.FC<ScoreboardViewSelectorProps> = ({
    value,
    onChange,
}) => {
    const navigate = useNavigate();

    const defaultOnChange = (value: string) => {
        navigate(`../${value}`);
    };

    return (
        <TextField
            data-cy='scoreboard-view-selector'
            id='scoreboard-cohort-select'
            select
            label='View'
            value={value}
            onChange={(event) =>
                onChange
                    ? onChange(event.target.value)
                    : defaultOnChange(event.target.value)
            }
            sx={{ mb: 3 }}
            fullWidth
        >
            <MenuItem value='search'>User Search</MenuItem>
            <MenuItem value='stats'>Statistics</MenuItem>
            <MenuItem value='dojo'>Full Dojo</MenuItem>
            <MenuItem value='following'>People I Follow</MenuItem>
            {dojoCohorts.map((option) => (
                <MenuItem key={option} value={option}>
                    {option}
                </MenuItem>
            ))}
        </TextField>
    );
};

export default ScoreboardViewSelector;
