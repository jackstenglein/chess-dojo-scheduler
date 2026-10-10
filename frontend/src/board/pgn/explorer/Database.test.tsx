import { RequestStatus } from '@/api/Request';
import { ExplorerMove, ExplorerPosition } from '@/database/explorer';
import { PaginationResult } from '@/hooks/usePagination';
import { renderWithIntl } from '@/i18n/intl.test';
import { DataGridProProps, GridApiPro } from '@mui/x-data-grid-pro';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Database from './Database';
import { ExplorerDatabaseType } from './Explorer';

const { gridProps } = vi.hoisted(() => ({
    gridProps: { current: undefined as DataGridProProps<ExplorerMove> | undefined },
}));

vi.mock('@/auth/Auth', () => ({ useFreeTier: () => false }));
vi.mock('../../Board', () => ({ useReconcile: () => vi.fn() }));
vi.mock('../PgnBoard', () => ({ useChess: () => ({ chess: undefined }) }));
vi.mock('@/components/games/list/GameTable', () => ({ default: () => null }));
vi.mock('@/components/navigation/Link', () => ({ Link: () => null }));
vi.mock('@/components/ui/MultipleSelectChip', () => ({ default: () => null }));
vi.mock('@/loading/LoadingPage', () => ({ default: () => null }));
vi.mock('@/style/Icon', () => ({ default: () => null }));
vi.mock('@/upsell/UpsellAlert', () => ({ default: () => null }));
vi.mock('./GameContextMenu', () => ({ GameContextMenu: () => null }));
vi.mock('./player/PerformanceSummary', () => ({ PerformanceSummary: () => null }));
vi.mock('./Explorer', () => ({
    ExplorerDatabaseType: {
        Dojo: 'dojo',
        Masters: 'masters',
        Lichess: 'lichess',
        Player: 'player',
    },
}));
vi.mock('@mui/x-data-grid-pro', () => ({
    DataGridPro: (props: DataGridProProps<ExplorerMove>) => {
        gridProps.current = props;
        return (
            <div>
                {[...(props.rows ?? []), ...(props.pinnedRows?.bottom ?? [])].map((row) => (
                    <div key={row.san}>{row.san}</div>
                ))}
            </div>
        );
    },
}));

const position: ExplorerPosition = {
    id: 'POSITION',
    normalizedFen: 'after-e4',
    results: { '1500-1600': { white: 10 } },
    moves: { e5: { san: 'e5', results: { '1500-1600': { white: 10 } } } },
};

const pagination: PaginationResult = {
    page: 0,
    pageSize: 10,
    data: [],
    request: {
        status: RequestStatus.NotSent,
        onStart: vi.fn(),
        onSuccess: vi.fn(),
        onFailure: vi.fn(),
        reset: vi.fn(),
        isLoading: () => false,
        isSent: () => false,
        isFailure: () => false,
    },
    rowCount: 0,
    hasMore: false,
    setGames: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    onSearch: vi.fn(),
    onDelete: vi.fn(),
};

function renderDatabase({ empty = false, resizable = true } = {}) {
    return renderWithIntl(
        <Database
            type={ExplorerDatabaseType.Dojo}
            fen='after-e4'
            position={empty ? { ...position, moves: {} } : position}
            isLoading={false}
            splitStorageKey={resizable ? 'test.databaseSplit' : undefined}
            pagination={pagination}
        />,
    );
}

function resizeGrid(height: number, rowHeight = 52, headerHeight = 56) {
    const api = {
        getRootDimensions: () => ({
            viewportOuterSize: { width: 500, height },
            topContainerHeight: headerHeight,
            hasScrollX: false,
            scrollbarSize: 0,
            rowHeight,
        }),
    } as GridApiPro;
    act(() =>
        gridProps.current?.onResize?.(
            { width: 500, height },
            {},
            { api, apiRef: { current: api } },
        ),
    );
}

describe('Database move stats', () => {
    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it.each([
        { rowHeight: 52, headerHeight: 56 },
        { rowHeight: 36, headerHeight: 40 },
    ])('prioritizes a move row using measured sizes: %j', ({ rowHeight, headerHeight }) => {
        renderDatabase();
        resizeGrid(headerHeight + rowHeight, rowHeight, headerHeight);
        expect(screen.getByText('e5')).toBeInTheDocument();
        expect(screen.queryByText('Total')).not.toBeInTheDocument();

        resizeGrid(headerHeight + 2 * rowHeight, rowHeight, headerHeight);
        expect(screen.getByText('e5')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('keeps the total when there are no moves', () => {
        renderDatabase({ empty: true });
        resizeGrid(112);
        expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('keeps the total for the original non-resizable table', () => {
        renderDatabase({ resizable: false });
        resizeGrid(112);
        expect(screen.getByText('Total')).toBeInTheDocument();
    });
});
