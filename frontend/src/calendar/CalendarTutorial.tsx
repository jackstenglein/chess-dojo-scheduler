import { Step } from 'react-joyride';

import Tutorial from '../tutorial/Tutorial';
import { TutorialName } from '../tutorial/tutorialNames';

const steps: Step[] = [
    {
        target: 'body',
        placement: 'center',
        title: 'Calendar',
        content:
            "Welcome to the calendar! Let's take a quick tour to learn how to use it.",
        disableBeacon: true,
    },
    {
        target: '#current-timezone',
        title: 'Timezone',
        content:
            'By default, the calendar displays events in your current timezone. If you want to change timezones, you can use this dropdown.',
    },
    {
        target: '#my-calendar-filters',
        title: 'Filters',
        content:
            'The filters in this section allow you to hide availabilities you have created and meetings you have booked.',
    },
    {
        target: '#dojo-calendar-filters',
        title: 'Filters',
        content: (
            <div>
                The filters in this section allow you to search through events posted by
                other Dojo members. There are 3 types of filters:
                <ul>
                    <li style={{ marginBottom: '4px' }}>
                        Dojo Events - These are Dojo-wide sparring arenas or Dojo-wide
                        events posted by the Sensei. They appear on the calendar as green.
                    </li>
                    <li style={{ marginBottom: '4px' }}>
                        Meeting Types - This section allows you to filter bookable events
                        (red events) by their type.
                    </li>
                    <li>
                        Cohorts - This section allows you to filter bookable events (red
                        events) by the cohort of the person that posted them. Note that
                        when creating an event, the poster gets to set the cohorts that
                        are able to book. Both your cohorts and theirs must match for you
                        to see the event.
                    </li>
                </ul>
            </div>
        ),
        placement: 'right',
    },
    {
        target: '.rs__cell.rs__today_cell:not(.rs__header)',
        title: 'Calendar',
        content:
            "To create a new event, click a time slot in the calendar. Your event can span multiple time slots. To book someone else's event, click on the event. Events that you have booked will appear on the Meetings tab in the navbar.",
    },
    {
        target: '[data-testid="view-navigator"]',
        title: 'View',
        content:
            'The calendar is shown in week view by default, but you can use these buttons to switch to month or day views as well.',
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Tutorial Complete',
        content:
            'Great job completing this tutorial! If you ever need to go through it again, check the help page in the navbar.',
    },
];

const CalendarTutorial = () => {
    return <Tutorial name={TutorialName.CalendarPage} steps={steps} zIndex={1000} />;
};

export default CalendarTutorial;
