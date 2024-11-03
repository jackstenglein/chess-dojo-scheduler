'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

export interface TutorialState {
    activeTutorial?: string;
}

const initialTutorialState: TutorialState = {};

interface TutorialContextType {
    tutorialState: TutorialState;
    setTutorialState: (
        state: TutorialState | ((prevState: TutorialState) => TutorialState),
    ) => void;
}

export const TutorialContext = createContext<TutorialContextType>({
    tutorialState: initialTutorialState,
    setTutorialState: () => null,
});

export function TutorialProvider({ children }: { children: ReactNode }) {
    const [tutorialState, setTutorialState] = useState(initialTutorialState);

    return (
        <TutorialContext.Provider value={{ tutorialState, setTutorialState }}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    return useContext(TutorialContext);
}
