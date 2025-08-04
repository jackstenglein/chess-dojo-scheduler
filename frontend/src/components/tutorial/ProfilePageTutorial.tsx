import { Step } from 'react-joyride-react19-compat';
import Tutorial from './Tutorial';
import { TutorialName } from './tutorialNames';

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
        target: '#training-plan-view-select',
        title: 'Training Plan View',
        content:
            'By default, you see a weekly view of your training plan, but you can use these buttons to switch to a daily view or a list of all tasks in the program.',
    },
    {
        target: '#work-goal-editor',
        title: 'Work Goal',
        content: `You're currently set to spend one hour per day studying chess. If you want to adjust that, you can use this button.`,
    },
    {
        target: '#task-details',
        title: 'Task Details',
        content:
            'Here you can see the name and category of each task, as well as your progress on it. You can click the task name to see the full description and instructions.',
    },
    {
        target: '#task-status',
        title: 'Updating Progress',
        content: `Here you'll see how much time you've spent on each task and whether you've completed it. You can click the progress icon to update the task. You can also use the pin icon to force a task to stay in your weekly suggestions.`,
    },
    {
        target: '#graduate-button',
        title: 'Graduating',
        content:
            "When your rating climbs high enough, use this button to graduate and move to the next cohort. You don't need to complete all of the tasks for your cohort before graduating. Jesse will review one of your games in the next graduation show, so try to submit at least one annotated game before graduating!",
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
