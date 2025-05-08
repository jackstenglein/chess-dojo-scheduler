export interface BulletPointData {
    title: string;
    description?: string;
}

export const trainingPlanBulletPoints: BulletPointData[] = [
    {
        title: 'Daily and Weekly Tasks',
        description:
            'Your study plan is broken down into daily tasks bespoke to your training needs.',
    },
    {
        title: 'Hand-picked Training Material',
        description:
            'All the material is hand-picked for each level of chess player by our GM and IM senseis.',
    },
    {
        title: 'Advanced Improvement Tracking',
        description: 'Get insights and tracking data to see your chess progress and areas of work.',
    },
    {
        title: 'Innovative Tests and Tactics',
        description: `ChessDojo's proprietary tests will pinpoint your tactics strength.`,
    },
    {
        title: 'Access to Our Chess Community',
        description:
            'Find real opponents and chess mentors ready to analyze, spar and help your game.',
    },
    {
        title: 'Ratings Dashboard',
        description: 'ChessDojo translates all rating systems into a universal Dojo rating.',
    },
    {
        title: 'Chess Sparring',
        description: 'A core feature of the program is having people and positions to spar.',
    },
    {
        title: 'Opening Courses',
        description: 'Members get free access to a bunch of our opening courses.',
    },
];

export const communityBulletPoints: BulletPointData[] = [
    {
        title: 'Study Groups',
        description: 'ChessDojo community leaders regularly run study groups for each cohort.',
    },
    {
        title: 'Classical Tournaments',
        description: `Don't have a chess club to play classical games and analyze? We've got your back.`,
    },
    {
        title: 'Graduation Streams',
        description: `When you graduate from each cohort, you'’'ll have a game analyzed on stream by a sensei.`,
    },
    {
        title: 'Innovative Tests and Tactics',
        description: `ChessDojo’s proprietary tests will pinpoint your tactics strength.`,
    },
    {
        title: 'Access to Our Chess Community',
        description: `Find real opponents and chess mentors ready to analyze, spar and help your game.`,
    },
    {
        title: 'Private Discord',
        description: `You’ll have access to an active Discord server packed full of Dojoers.`,
    },
    {
        title: 'Clubs',
        description: `You can join and create your own clubs. So get involved and track your buddies' progress.`,
    },
    {
        title: 'Workshops',
        description: `Senseis will run workshops at their discretion.`,
    },
];

export const membershipBulletPoints: BulletPointData[] = [
    { title: 'Daily and Weekly Tasks' },
    { title: 'Hand-picked Training Material' },
    { title: 'Advanced Improvement Tracking' },
    { title: 'Access to Our Chess Community' },
    { title: 'Innovative Tests and Tactics' },
    { title: 'Opening Courses' },
    { title: 'Study Groups' },
    { title: 'Private Discord' },
    { title: 'Workshops' },
];

export const freeBulletPoints = [
    { title: 'Limited Training Plans' },
    { title: 'Limited Games Database' },
    { title: 'Advanced Improvement Tracking', excluded: true },
    { title: 'Access to Our Chess Community', excluded: true },
    { title: 'Innovative Tests and Tactics', excluded: true },
    { title: 'Opening Courses', excluded: true },
    { title: 'Study Groups', excluded: true },
    { title: 'Private Discord', excluded: true },
    { title: 'Workshops', excluded: true },
];
