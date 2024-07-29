import { Step } from 'react-joyride';

import Tutorial from '../../tutorial/Tutorial';
import { TutorialName } from '../../tutorial/tutorialNames';

const steps: Step[] = [
    {
        target: 'body',
        placement: 'center',
        content: "Let's take a quick tour to learn how to use the site.",
        title: 'Welcome to the Dojo!',
        disableBeacon: true,
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Profile',
        content:
            'This page is your profile. It contains everything you need to be successful in your training plan, and you can access it at any time using the navbar at the top of the page.',
    },
    {
        target: '#training-plan-tab',
        title: 'Training Plan',
        content:
            'On the Training Plan tab, you can see the tasks you need to complete as part of the training program.',
    },
    {
        target: '#training-plan-cohort-select',
        title: 'Viewing Other Cohorts',
        content:
            'If you want to view the tasks for other cohorts, you can use this selector to switch between them.',
    },
    {
        target: '#cohort-score-card',
        title: 'Cohort Score',
        content:
            "The cohort score card lets you see at a glance how much progress you've made in your cohort tasks, both overall and by category.",
    },
    {
        target: '#Welcome-to-the-Dojo-header',
        title: 'Task Categories',
        content:
            'Tasks are divided into 6 categories. You can click on a category header to expand it and view/update the tasks within that category.',
    },
    {
        target: '#task-details',
        title: 'Task Details',
        content:
            'Here you can see the name and a short description of the task, and you can click on "View Description" to see the full task description.',
    },
    {
        target: '#task-status',
        title: 'Updating Progress',
        content:
            'Here you can see the time spent on each task and whether it is complete. You can click the checkbox to update your progress on the task.',
    },
    {
        target: '#graduate-button',
        title: 'Graduating',
        content:
            "When your rating climbs high enough, use this button to graduate. You don't need to complete all of the tasks for your cohort before graduating. Graduating will move you to the next cohort and create a graduation record on the Recent page. Jesse will review one of your games in the next graduation show, so try to submit at least one game analysis before graduating!",
    },
    {
        target: '#edit-profile-button',
        title: 'Editing Your Profile',
        content:
            'If you want to switch cohorts without graduating (eg. if the program is too hard/easy), then use this button to edit your profile. You can also use this to change your display name, bio and preferred rating system.',
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Tutorial Complete',
        content:
            'Great job completing this tutorial! If you ever need to go through it again, check the help page in the navbar.',
    },
];

const ProfilePageTutorial = () => {
    return <Tutorial name={TutorialName.ProfilePage} steps={steps} />;
};

export default ProfilePageTutorial;
