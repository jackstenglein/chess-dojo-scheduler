import { useApi } from '@/api/Api';
import { useAuth } from '@/auth/Auth';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import { useCallback, useMemo } from 'react';
import ReactJoyride, { CallBackProps, Step } from 'react-joyride-react19-compat';
import { TutorialName } from './tutorialNames';
import TutorialTooltip from './TutorialTooltip';

interface TutorialProps {
    name: TutorialName;
    steps: Step[];
    zIndex?: number;
}

const Tutorial: React.FC<TutorialProps> = ({ name, steps, zIndex }) => {
    const { searchParams, updateSearchParams } = useNextSearchParams();
    const { user, updateUser } = useAuth();
    const api = useApi();

    const darkMode = !user?.enableLightMode;

    const callback = useCallback(
        (state: CallBackProps) => {
            if (state.status === 'finished' || state.action === 'close') {
                const tutorials = {
                    ...user?.tutorials,
                    [name]: true,
                };
                updateUser({ tutorials });
                api.updateUser({
                    tutorials,
                }).catch((err: unknown) => console.error('completeTutorial: ', err));
                updateSearchParams({ tutorial: '' });
            }
        },
        [api, user?.tutorials, name, updateUser, updateSearchParams],
    );

    const run = (user && !user.tutorials?.[name]) || searchParams.get('tutorial') === 'true';

    const Joyride = useMemo(
        () => (
            <ReactJoyride
                run={run}
                continuous
                steps={steps}
                tooltipComponent={TutorialTooltip}
                styles={{
                    options: {
                        arrowColor: darkMode ? '#1e1e1e' : 'white',
                        zIndex: zIndex || 100,
                    },
                }}
                disableOverlayClose
                scrollOffset={100}
                callback={callback}
            />
        ),
        [run, callback, darkMode, steps, zIndex],
    );

    return Joyride;
};

export default Tutorial;
