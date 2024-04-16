import { useState, MouseEvent } from 'react';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { Button, Popover, Stack } from '@mui/material';
import { format, getMonth, getYear, setMonth } from 'date-fns';
import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { IconButton, IconButtonProps } from '@mui/material';

export const MIN_YEAR = 2023;
export const MIN_MONTH = 6;
export const MIN_DATE = '2023-07-11';

interface LocaleArrowProps extends Omit<IconButtonProps, 'type'> {
    type: 'prev' | 'next';
    onClick?(e?: MouseEvent): void;
}

export const LocaleArrow = ({ type, onClick, ...props }: LocaleArrowProps) => {
    let Arrow = NavigateNextRoundedIcon;
    if (type === 'prev') {
        Arrow = NavigateBeforeRoundedIcon;
    }

    return (
        <IconButton
            onClick={onClick}
            onDragOver={(e) => {
                e.preventDefault();
                if (onClick) {
                    onClick();
                }
            }}
            {...props}
        >
            <Arrow />
        </IconButton>
    );
};

interface MonthDateButtonProps {
    selectedDate: Date;
    onChange(value: Date): void;
}

const MonthDateButton = ({ selectedDate, onChange }: MonthDateButtonProps) => {
    const currentMonth = getMonth(selectedDate);
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
        const prevMonth = currentMonth - 1;
        onChange(setMonth(selectedDate, prevMonth));
    };
    const handleNext = () => {
        const nextMonth = currentMonth + 1;
        onChange(setMonth(selectedDate, nextMonth));
    };

    console.log('Current Month: ', currentMonth);
    console.log('Current Year: ', currentYear);

    return (
        <Stack direction='row' alignItems='center'>
            <LocaleArrow
                type='prev'
                onClick={handlePrev}
                aria-label='previous month'
                disabled={currentMonth <= MIN_MONTH && currentYear === MIN_YEAR}
            />
            <Button
                style={{ padding: 4 }}
                onClick={handleOpen}
                aria-label='selected month'
            >
                {format(selectedDate, 'MMMM yyyy')}
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
                        openTo='month'
                        views={['year', 'month']}
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
                aria-label='next month'
                disabled={
                    currentMonth >= getMonth(new Date()) &&
                    currentYear >= getYear(new Date())
                }
            />
        </Stack>
    );
};

export default MonthDateButton;
