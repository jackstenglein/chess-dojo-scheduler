import { describe, expect, it, vi } from 'vitest';

// Mock axiosService before importing the module under test
vi.mock('./axiosService', () => ({
    axiosService: {
        get: vi.fn(),
        delete: vi.fn(),
    },
}));

import { axiosService } from './axiosService';
import { deleteAllNotifications, deleteNotification, listNotifications } from './notificationApi';

describe('notificationApi', () => {
    describe('listNotifications', () => {
        it('calls GET /user/notifications with auth header', () => {
            listNotifications('test-token');
            expect(axiosService.get).toHaveBeenCalledWith('/user/notifications', {
                params: { startKey: undefined },
                headers: { Authorization: 'Bearer test-token' },
                functionName: 'listNotifications',
            });
        });

        it('passes startKey as a query param', () => {
            listNotifications('test-token', 'some-key');
            expect(axiosService.get).toHaveBeenCalledWith('/user/notifications', {
                params: { startKey: 'some-key' },
                headers: { Authorization: 'Bearer test-token' },
                functionName: 'listNotifications',
            });
        });
    });

    describe('deleteNotification', () => {
        it('calls DELETE /user/notifications/{base64Id} with auth header', () => {
            const id = 'GAME_COMMENT|2000-2100|abc123';
            const encodedId = btoa(id);
            deleteNotification('test-token', id);
            expect(axiosService.delete).toHaveBeenCalledWith(
                `/user/notifications/${encodedId}`,
                {
                    headers: { Authorization: 'Bearer test-token' },
                    functionName: 'deleteNotification',
                },
            );
        });
    });

    describe('deleteAllNotifications', () => {
        it('calls DELETE /user/notifications with auth header', () => {
            deleteAllNotifications('test-token');
            expect(axiosService.delete).toHaveBeenCalledWith('/user/notifications', {
                headers: { Authorization: 'Bearer test-token' },
                functionName: 'deleteAllNotifications',
            });
        });
    });
});
