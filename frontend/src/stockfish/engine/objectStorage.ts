/**
 * Credit: Lichess.org
 *
 * See https://github.com/lichess-org/lila/blob/master/ui/common/src/objectStorage.ts
 */

/** Information on the database. */
export interface DbInfo {
    /** The name of what the database stores. */
    store: string;

    /**
     * The name of the database.
     * @default `${store}--db`
     */
    db?: string;

    /**
     * The version of the database.
     * @default 1
     */
    version?: number;

    /** A function which upgrades the database. */
    upgrade?: (e: IDBVersionChangeEvent, store?: IDBObjectStore) => void;
}

export interface ObjectStorage<V, K extends IDBValidKey = IDBValidKey> {
    list(): Promise<K[]>;
    get(key: K): Promise<V>;
    getMany(keys?: IDBKeyRange): Promise<V[]>;
    put(key: K, value: V): Promise<K>; // returns key
    count(key?: K | IDBKeyRange): Promise<number>;
    remove(key: K | IDBKeyRange): Promise<void>;
    clear(): Promise<void>; // remove all
    cursor(range?: IDBKeyRange, dir?: IDBCursorDirection): Promise<IDBCursorWithValue | undefined>;
    txn(mode: IDBTransactionMode): IDBTransaction; // do anything else
}

export async function objectStorage<V, K extends IDBValidKey = IDBValidKey>(
    dbInfo: DbInfo,
): Promise<ObjectStorage<V, K>> {
    const db = await dbConnect(dbInfo);

    function objectStore(mode: IDBTransactionMode) {
        return db.transaction(dbInfo.store, mode).objectStore(dbInfo.store);
    }

    function actionPromise<V>(f: () => IDBRequest) {
        return new Promise<V>((resolve, reject) => {
            const res = f();
            res.onsuccess = (e: Event) => resolve((e.target as IDBRequest).result as V);
            res.onerror = (e: Event) => reject((e.target as IDBRequest).result as Error);
        });
    }

    return {
        list: () => actionPromise<K[]>(() => objectStore('readonly').getAllKeys()),
        get: (key: K) => actionPromise<V>(() => objectStore('readonly').get(key)),
        getMany: (keys?: IDBKeyRange) =>
            actionPromise<V[]>(() => objectStore('readonly').getAll(keys)),
        put: (key: K, value: V) => actionPromise<K>(() => objectStore('readwrite').put(value, key)),
        count: (key?: K | IDBKeyRange) =>
            actionPromise<number>(() => objectStore('readonly').count(key)),
        remove: (key: K | IDBKeyRange) => actionPromise(() => objectStore('readwrite').delete(key)),
        clear: () => actionPromise(() => objectStore('readwrite').clear()),
        cursor: (keys?: IDBKeyRange, dir?: IDBCursorDirection) =>
            actionPromise<IDBCursorWithValue | undefined>(() =>
                objectStore('readonly').openCursor(keys, dir),
            ).then((cursor) => cursor ?? undefined),
        txn: (mode: IDBTransactionMode) => db.transaction(dbInfo.store, mode),
    };
}

export async function dbConnect(dbInfo: DbInfo): Promise<IDBDatabase> {
    const dbName = dbInfo?.db || `${dbInfo.store}--db`;

    return new Promise<IDBDatabase>((resolve, reject) => {
        const result = window.indexedDB.open(dbName, dbInfo?.version ?? 1);

        result.onsuccess = (e: Event) => resolve((e.target as IDBOpenDBRequest).result);
        result.onerror = (e: Event) =>
            reject(((e.target as IDBOpenDBRequest).error as Error) ?? 'IndexedDB Unavailable');
        result.onupgradeneeded = (e: IDBVersionChangeEvent) => {
            const db = (e.target as IDBOpenDBRequest).result;
            const txn = (e.target as IDBOpenDBRequest).transaction;
            const store = db.objectStoreNames.contains(dbInfo.store)
                ? txn?.objectStore(dbInfo.store)
                : db.createObjectStore(dbInfo.store);

            dbInfo.upgrade?.(e, store);
        };
    });
}

export async function dbExists(dbInfo: DbInfo): Promise<boolean> {
    const dbName = dbInfo?.db || `${dbInfo.store}--db`;
    const found = (await window.indexedDB.databases()).some((db) => db.name === dbName);
    if (!found) return false;
    const store = await objectStorage(dbInfo);
    return (await store.count()) > 0;
}
