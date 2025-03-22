import { useAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../calendar/displayDate';

export function ViewerDateString({ date }: { date?: string }) {
    const { user } = useAuth();
    if (!date) {
        return '';
    }
    const d = new Date(date);
    return `${toDojoDateString(d, user?.timezoneOverride)} • ${toDojoTimeString(d, user?.timezoneOverride, user?.timeFormat)}`;
}
