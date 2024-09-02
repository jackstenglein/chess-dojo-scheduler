import { useCallback, useEffect, useMemo } from 'react';
import ReactJoyride, { CallBackProps, Step } from 'react-joyride';

import { useApi } from '@/api/Api';
import { useAuth } from '@/auth/Auth';
import { useTutorial } from './TutorialContext';
import { TutorialName } from './tutorialNames';
import TutorialTooltip from './TutorialTooltip';

interface TutorialProps {
    name: TutorialName;
    steps: Step[];
    zIndex?: number;
}

const Tutorial: React.FC<TutorialProps> = ({ name, steps, zIndex }) => {
    const user = useAuth().user;
    const api = useApi();
    const darkMode = !user?.enableLightMode;
    const { tutorialState, setTutorialState } = useTutorial();

    useEffect(() => {
        if (!user?.tutorials?.[name] && tutorialState.activeTutorial !== name) {
            setTutorialState({ activeTutorial: name });
        }
    }, [user, name, tutorialState, setTutorialState]);

    const callback = useCallback(
        (state: CallBackProps) => {
            if (state.status === 'finished' || state.action === 'close') {
                api.updateUser({
                    tutorials: {
                        ...user?.tutorials,
                        [name]: true,
                    },
                })
                    .then(() => {
                        setTutorialState({});
                    })
                    .catch((err: unknown) => console.error('completeTutorial: ', err));
            }
        },
        [setTutorialState, api, user?.tutorials, name],
    );

    const activeTutorial = tutorialState.activeTutorial;
    const Joyride = useMemo(
        () => (
            <ReactJoyride
                run={activeTutorial === name}
                continuous
                steps={steps}
                tooltipComponent={TutorialTooltip}
                styles={{
                    options: {
                        arrowColor: darkMode ? '#1e1e1e' : 'white',
                        zIndex: zIndex || 100,
                    },
                }}
                scrollOffset={100}
                callback={callback}
            />
        ),
        [activeTutorial, callback, darkMode, steps, name, zIndex],
    );

    return Joyride;
};

export default Tutorial;
