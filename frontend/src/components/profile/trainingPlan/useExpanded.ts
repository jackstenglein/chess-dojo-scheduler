import { useState } from 'react';

export function useExpanded(initialState: Record<string, boolean>) {
    const [expanded, setExpanded] = useState(initialState);

    const toggleExpand = (name: string) => {
        setExpanded({
            ...expanded,
            [name]: !expanded[name],
        });
    };

    const onExpandAll = () => {
        setExpanded((c) =>
            Object.keys(c).reduce<Record<string, boolean>>((acc, cat) => {
                acc[cat] = true;
                return acc;
            }, {}),
        );
    };

    const onCollapseAll = () => {
        setExpanded((c) =>
            Object.keys(c).reduce<Record<string, boolean>>((acc, cat) => {
                acc[cat] = false;
                return acc;
            }, {}),
        );
    };

    return {
        expanded,
        setExpanded,
        toggleExpand,
        onExpandAll,
        onCollapseAll,
    };
}
