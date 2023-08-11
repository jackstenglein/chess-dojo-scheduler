import { useState } from 'react';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Button, Popover, Stack } from '@mui/material';
import { format, getYear, setYear } from 'date-fns';

import { LocaleArrow, MIN_DATE, MIN_YEAR } from './MonthDateButton';

interface YearDateButtonProps {
    selectedDate: Date;
    onChange(value: Date): void;
}

const YearDateButton = ({ selectedDate, onChange }: YearDateButtonProps) => {
    const currentYear = getYear(selectedDate);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleChange = (e: Date | null) => {
        onChange(e || new Date());
        handleClose();
    };
    const handlePrev = () => {
        onChange(setYear(selectedDate, currentYear - 1));
    };
    const handleNext = () => {
        onChange(setYear(selectedDate, currentYear + 1));
    };

    return (
        <Stack direction='row' alignItems='center'>
            <LocaleArrow
                type='prev'
                onClick={handlePrev}
                aria-label='previous year'
                disabled={currentYear <= MIN_YEAR}
            />
            <Button
                style={{ padding: 4 }}
                onClick={handleOpen}
                aria-label='selected year'
            >
                {format(selectedDate, 'yyyy')}
            </Button>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateCalendar
                        openTo='year'
                        views={['year']}
                        value={selectedDate}
                        onChange={handleChange}
                        disableFuture
                        minDate={new Date(MIN_DATE)}
                    />
                </LocalizationProvider>
            </Popover>
            <LocaleArrow
                type='next'
                onClick={handleNext}
                aria-label='next year'
                disabled={currentYear >= getYear(new Date())}
            />
        </Stack>
    );
};

export default YearDateButton;
