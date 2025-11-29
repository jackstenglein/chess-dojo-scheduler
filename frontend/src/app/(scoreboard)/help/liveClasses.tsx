import { Link } from '@/components/navigation/Link';

export const liveClassesFaq = {
    title: 'Live Classes',
    items: [
        {
            title: 'What types of live classes are offered?',
            content: (
                <>
                    There are two types of classes: larger lecture-style group classes and smaller,
                    more personal Game and Profile Review classes. The lecture classes cover a
                    variety of different specialized topics (for example endgame fundamentals,
                    calculation or the Najdorf) and rotate monthly. In the Game and Profile Review
                    classes, the sensei focuses on a single player, analyzing their training habits
                    and (at least) one of their annotated games.
                </>
            ),
        },
        {
            title: 'When do the live classes start?',
            content: (
                <>
                    Live classes start in January 2026. The full class calendar is available{' '}
                    <Link
                        target='_blank'
                        href='https://calendar.google.com/calendar/u/0/embed?src=c_771ab8bd3bcf653ae9cecfe549531b3894a17d052e5986da0bd3e1259e2778fc@group.calendar.google.com&mode=MONTH&dates=20260101/20260131&showPrint=0&showNav=0&showTabs=0&showCalendars=0'
                    >
                        here
                    </Link>
                    .
                </>
            ),
        },
        {
            title: 'Where can I view the class calendar?',
            content: (
                <>
                    The class calendar is available{' '}
                    <Link
                        target='_blank'
                        href='https://calendar.google.com/calendar/u/0/embed?src=c_771ab8bd3bcf653ae9cecfe549531b3894a17d052e5986da0bd3e1259e2778fc@group.calendar.google.com&mode=MONTH&dates=20260101/20260131&showPrint=0&showNav=0&showTabs=0&showCalendars=0'
                    >
                        here
                    </Link>
                    .
                </>
            ),
        },
        {
            title: 'Are these the only classes being offered?',
            content: (
                <>
                    We will add further classes and different time slots as we get more students.
                    This applies to both the group lectures and the Game and Profile Review classes.
                    The topics of the group lectures will also rotate monthly.
                </>
            ),
        },
        {
            title: 'How much do the classes cost?',
            content: (
                <>
                    The group lecture classes are available on the $75/month subscription tier. The
                    Game and Profile Review classes are available on the $200/month subscription
                    tier. The $200/month subscription tier also provides access to the group lecture
                    classes. Both subscription tiers provide full access to the rest of the
                    ChessDojo training plan and website.
                </>
            ),
        },
        {
            title: 'What rating ranges are the classes for?',
            content: (
                <>
                    The Game and Profile Review classes are split into the following rating ranges:
                    0-600, 600-1000, 1000-1400, 1400-1800, 1800+ (these ratings all use the{' '}
                    <Link href='/material/ratings'>ChessDojo rating scale</Link>). For the Game and
                    Profile Review classes, you can only join the class for your specific cohort.
                    The group lecture classes are roughly split among the same rating ranges but may
                    cover broader or more targeted ranges for a given class. Each class will specify
                    its recommended rating range. Any subscriber can join the group lecture classes,
                    even if they are outside the recommended rating range. However, the class
                    material will be designed for the recommended rating range.
                </>
            ),
        },
        {
            title: 'How many students can join each class?',
            content: (
                <>
                    The group lecture classes have no limit on the amount of students that can join
                    each class. The Game and Profile Review classes will be limited to approximately
                    10 students. As more students join a given cohort range, they will be split into
                    additional sections. For example, there might be two sections of the 600-1000
                    Game and Profile Review, each with 7 students.
                </>
            ),
        },
        {
            title: 'How do I join the classes?',
            content: (
                <>
                    All classes will be conducted through Google Meet. This allows us to
                    automatically record and upload the classes for viewing on demand.
                </>
            ),
        },
        {
            title: `What if I can't make a class?`,
            content: (
                <>
                    All classes will be recorded and uploaded to Google Drive. Subscribers will be
                    able to view the recordings of all classes.
                </>
            ),
        },
        {
            title: 'How do I communicate with other students?',
            content: (
                <>
                    Subscribers will get access to a private section of Discord channels. There will
                    be a channel for each group lecture class, as well as channels specifically for
                    each Game and Profile Review cohort. Subscribers will have access to all group
                    lecture Discord channels, but only the members in a specific Game and Profile
                    Review cohort will have access to the corresponding Discord channel.
                </>
            ),
        },
        {
            title: `Is the Black Friday discount permanent or just for a single month?`,
            content: (
                <>
                    If you subscribe before December 2nd 2025 and use the code{' '}
                    <strong>BLACKFRIDAY</strong>, you will receive 25% off your first month.
                </>
            ),
        },
        {
            title: `The group classes don't start until January, but it looks like I will be charged again before that?`,
            content: (
                <>
                    If you are upgrading your current subscription, this is a limitation in the UI
                    of our payment processor Stripe. We will make sure that all subscriptions are
                    fixed in Stripe so that your second charge will not take place until Feb 1,
                    2026, after which you will be charged monthly.
                </>
            ),
        },
    ],
};
