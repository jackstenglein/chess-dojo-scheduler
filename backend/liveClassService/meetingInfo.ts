interface MeetingInfo {
    keyPrefix: string;
    name: string;
}

export const MEETING_INFO: Record<string, Record<string, MeetingInfo>> = {
    dev: {
        'rsb-swjc-sry': {
            keyPrefix: 'test',
            name: 'Test Meeting',
        },
    },
} as const;
