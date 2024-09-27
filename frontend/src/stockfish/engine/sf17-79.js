var Sf1779Web = (() => {
    var _scriptName = import.meta.url;

    return function (moduleArg = {}) {
        var moduleRtn;

        function GROWABLE_HEAP_I8() {
            if (wasmMemory.buffer != HEAP8.buffer) {
                updateMemoryViews();
            }
            return HEAP8;
        }
        function GROWABLE_HEAP_U8() {
            if (wasmMemory.buffer != HEAP8.buffer) {
                updateMemoryViews();
            }
            return HEAPU8;
        }
        function GROWABLE_HEAP_I32() {
            if (wasmMemory.buffer != HEAP8.buffer) {
                updateMemoryViews();
            }
            return HEAP32;
        }
        function GROWABLE_HEAP_U32() {
            if (wasmMemory.buffer != HEAP8.buffer) {
                updateMemoryViews();
            }
            return HEAPU32;
        }
        function GROWABLE_HEAP_F64() {
            if (wasmMemory.buffer != HEAP8.buffer) {
                updateMemoryViews();
            }
            return HEAPF64;
        }
        var Module = moduleArg;
        var readyPromiseResolve, readyPromiseReject;
        var readyPromise = new Promise((resolve, reject) => {
            readyPromiseResolve = resolve;
            readyPromiseReject = reject;
        });
        var ENVIRONMENT_IS_WEB = typeof window == 'object';
        var ENVIRONMENT_IS_WORKER = typeof importScripts == 'function';
        var ENVIRONMENT_IS_NODE =
            typeof process == 'object' &&
            typeof process.versions == 'object' &&
            typeof process.versions.node == 'string';
        var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && self.name == 'em-pthread';
        if (!Module['listen']) Module['listen'] = (data) => console.log(data);
        if (!Module['onError']) Module['onError'] = (data) => console.error(data);
        Module['getRecommendedNnue'] = (index = 0) =>
            UTF8ToString(_getRecommendedNnue(index));
        Module['setNnueBuffer'] = function (buf, index = 0) {
            if (!buf) throw new Error('buf is null');
            if (buf.byteLength <= 0) throw new Error(`${buf.byteLength} bytes?`);
            const heapBuf = _malloc(buf.byteLength);
            if (!heapBuf) throw new Error(`could not allocate ${buf.byteLength} bytes`);
            Module['HEAPU8'].set(buf, heapBuf);
            _setNnueBuffer(heapBuf, buf.byteLength, index);
        };
        Module['uci'] = function (command) {
            const sz = lengthBytesUTF8(command) + 1;
            const utf8 = _malloc(sz);
            if (!utf8) throw new Error(`Could not allocate ${sz} bytes`);
            stringToUTF8(command, utf8, sz);
            _uci(utf8);
        };
        Module['print'] = (data) => Module['listen']?.(data);
        Module['printErr'] = (data) => Module['onError']?.(data);
        var moduleOverrides = Object.assign({}, Module);
        var arguments_ = [];
        var thisProgram = './this.program';
        var quit_ = (status, toThrow) => {
            throw toThrow;
        };
        var scriptDirectory = '';
        function locateFile(path) {
            if (Module['locateFile']) {
                return Module['locateFile'](path, scriptDirectory);
            }
            return scriptDirectory + path;
        }
        var readAsync, readBinary;
        if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = self.location.href;
            } else if (typeof document != 'undefined' && document.currentScript) {
                scriptDirectory = document.currentScript.src;
            }
            if (_scriptName) {
                scriptDirectory = _scriptName;
            }
            if (scriptDirectory.startsWith('blob:')) {
                scriptDirectory = '';
            } else {
                scriptDirectory = scriptDirectory.substr(
                    0,
                    scriptDirectory.replace(/[?#].*/, '').lastIndexOf('/') + 1,
                );
            }
            {
                if (ENVIRONMENT_IS_WORKER) {
                    readBinary = (url) => {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', url, false);
                        xhr.responseType = 'arraybuffer';
                        xhr.send(null);
                        return new Uint8Array(xhr.response);
                    };
                }
                readAsync = (url) =>
                    fetch(url, { credentials: 'same-origin' }).then((response) => {
                        if (response.ok) {
                            return response.arrayBuffer();
                        }
                        return Promise.reject(
                            new Error(response.status + ' : ' + response.url),
                        );
                    });
            }
        } else {
        }
        var out = Module['print'] || console.log.bind(console);
        var err = Module['printErr'] || console.error.bind(console);
        Object.assign(Module, moduleOverrides);
        moduleOverrides = null;
        if (ENVIRONMENT_IS_PTHREAD) {
            var wasmPromiseResolve;
            var wasmPromiseReject;
            var initializedJS = false;
            function threadPrintErr(...args) {
                var text = args.join(' ');
                console.error(text);
            }
            if (!Module['printErr']) err = threadPrintErr;
            function threadAlert(...args) {
                var text = args.join(' ');
                postMessage({ cmd: 'alert', text: text, threadId: _pthread_self() });
            }
            self.alert = threadAlert;
            Module['instantiateWasm'] = (info, receiveInstance) =>
                new Promise((resolve, reject) => {
                    wasmPromiseResolve = (module) => {
                        var instance = new WebAssembly.Instance(module, getWasmImports());
                        receiveInstance(instance);
                        resolve();
                    };
                    wasmPromiseReject = reject;
                });
            self.onunhandledrejection = (e) => {
                throw e.reason || e;
            };
            function handleMessage(e) {
                try {
                    var msgData = e['data'];
                    var cmd = msgData['cmd'];
                    if (cmd === 'load') {
                        let messageQueue = [];
                        self.onmessage = (e) => messageQueue.push(e);
                        self.startWorker = (instance) => {
                            postMessage({ cmd: 'loaded' });
                            for (let msg of messageQueue) {
                                handleMessage(msg);
                            }
                            self.onmessage = handleMessage;
                        };
                        for (const handler of msgData['handlers']) {
                            if (!Module[handler] || Module[handler].proxy) {
                                Module[handler] = (...args) => {
                                    postMessage({
                                        cmd: 'callHandler',
                                        handler: handler,
                                        args: args,
                                    });
                                };
                                if (handler == 'print') out = Module[handler];
                                if (handler == 'printErr') err = Module[handler];
                            }
                        }
                        wasmMemory = msgData['wasmMemory'];
                        updateMemoryViews();
                        wasmPromiseResolve(msgData['wasmModule']);
                    } else if (cmd === 'run') {
                        __emscripten_thread_init(msgData['pthread_ptr'], 0, 0, 1, 0, 0);
                        __emscripten_thread_mailbox_await(msgData['pthread_ptr']);
                        establishStackSpace();
                        PThread.receiveObjectTransfer(msgData);
                        PThread.threadInitTLS();
                        if (!initializedJS) {
                            initializedJS = true;
                        }
                        try {
                            invokeEntryPoint(msgData['start_routine'], msgData['arg']);
                        } catch (ex) {
                            if (ex != 'unwind') {
                                throw ex;
                            }
                        }
                    } else if (cmd === 'cancel') {
                        if (_pthread_self()) {
                            __emscripten_thread_exit(-1);
                        }
                    } else if (msgData.target === 'setimmediate') {
                    } else if (cmd === 'checkMailbox') {
                        if (initializedJS) {
                            checkMailbox();
                        }
                    } else if (cmd) {
                        err(`worker: received unknown command ${cmd}`);
                        err(msgData);
                    }
                } catch (ex) {
                    __emscripten_thread_crashed();
                    throw ex;
                }
            }
            self.onmessage = handleMessage;
        }
        var wasmBinary;
        var wasmMemory;
        var wasmModule;
        var ABORT = false;
        var EXITSTATUS;
        var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
        function updateMemoryViews() {
            var b = wasmMemory.buffer;
            HEAP8 = new Int8Array(b);
            HEAP16 = new Int16Array(b);
            Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
            HEAPU16 = new Uint16Array(b);
            HEAP32 = new Int32Array(b);
            HEAPU32 = new Uint32Array(b);
            HEAPF32 = new Float32Array(b);
            HEAPF64 = new Float64Array(b);
        }
        if (!ENVIRONMENT_IS_PTHREAD) {
            if (Module['wasmMemory']) {
                wasmMemory = Module['wasmMemory'];
            } else {
                var INITIAL_MEMORY = 67108864;
                wasmMemory = new WebAssembly.Memory({
                    initial: INITIAL_MEMORY / 65536,
                    maximum: 2147483648 / 65536,
                    shared: true,
                });
                if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
                    err(
                        'requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag',
                    );
                    if (ENVIRONMENT_IS_NODE) {
                        err(
                            '(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and/or recent version)',
                        );
                    }
                    throw Error('bad memory');
                }
            }
            updateMemoryViews();
        }
        var __ATPRERUN__ = [];
        var __ATINIT__ = [];
        var __ATMAIN__ = [];
        var __ATEXIT__ = [];
        var __ATPOSTRUN__ = [];
        var runtimeInitialized = false;
        var runtimeExited = false;
        function preRun() {
            callRuntimeCallbacks(__ATPRERUN__);
        }
        function initRuntime() {
            runtimeInitialized = true;
            if (ENVIRONMENT_IS_PTHREAD) return;
            callRuntimeCallbacks(__ATINIT__);
        }
        function preMain() {
            if (ENVIRONMENT_IS_PTHREAD) return;
            callRuntimeCallbacks(__ATMAIN__);
        }
        function exitRuntime() {
            if (ENVIRONMENT_IS_PTHREAD) return;
            ___funcs_on_exit();
            callRuntimeCallbacks(__ATEXIT__);
            flush_NO_FILESYSTEM();
            PThread.terminateAllThreads();
            runtimeExited = true;
        }
        function postRun() {
            if (ENVIRONMENT_IS_PTHREAD) return;
            callRuntimeCallbacks(__ATPOSTRUN__);
        }
        function addOnPreRun(cb) {
            __ATPRERUN__.unshift(cb);
        }
        function addOnInit(cb) {
            __ATINIT__.unshift(cb);
        }
        var runDependencies = 0;
        var runDependencyWatcher = null;
        var dependenciesFulfilled = null;
        function addRunDependency(id) {
            runDependencies++;
        }
        function removeRunDependency(id) {
            runDependencies--;
            if (runDependencies == 0) {
                if (runDependencyWatcher !== null) {
                    clearInterval(runDependencyWatcher);
                    runDependencyWatcher = null;
                }
                if (dependenciesFulfilled) {
                    var callback = dependenciesFulfilled;
                    dependenciesFulfilled = null;
                    callback();
                }
            }
        }
        function abort(what) {
            what = 'Aborted(' + what + ')';
            err(what);
            ABORT = true;
            EXITSTATUS = 1;
            what += '. Build with -sASSERTIONS for more info.';
            var e = new WebAssembly.RuntimeError(what);
            readyPromiseReject(e);
            throw e;
        }
        var dataURIPrefix = 'data:application/octet-stream;base64,';
        var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
        function findWasmBinary() {
            if (Module['locateFile']) {
                var f = 'sf17-79.wasm';
                if (!isDataURI(f)) {
                    return locateFile(f);
                }
                return f;
            }
            return 'http://localhost:3000/engine/sf17-79.wasm';
        }
        var wasmBinaryFile;
        function getBinarySync(file) {
            if (file == wasmBinaryFile && wasmBinary) {
                return new Uint8Array(wasmBinary);
            }
            if (readBinary) {
                return readBinary(file);
            }
            throw 'both async and sync fetching of the wasm failed';
        }
        function getBinaryPromise(binaryFile) {
            if (!wasmBinary) {
                return readAsync(binaryFile).then(
                    (response) => new Uint8Array(response),
                    () => getBinarySync(binaryFile),
                );
            }
            return Promise.resolve().then(() => getBinarySync(binaryFile));
        }
        function instantiateArrayBuffer(binaryFile, imports, receiver) {
            return getBinaryPromise(binaryFile)
                .then((binary) => WebAssembly.instantiate(binary, imports))
                .then(receiver, (reason) => {
                    err(`failed to asynchronously prepare wasm: ${reason}`);
                    abort(reason);
                });
        }
        function instantiateAsync(binary, binaryFile, imports, callback) {
            if (
                !binary &&
                typeof WebAssembly.instantiateStreaming == 'function' &&
                !isDataURI(binaryFile) &&
                typeof fetch == 'function'
            ) {
                console.log('Fetching binary file: ', binaryFile);
                return fetch(binaryFile, { credentials: 'same-origin' }).then(
                    (response) => {
                        var result = WebAssembly.instantiateStreaming(response, imports);
                        return result.then(callback, function (reason) {
                            err(`wasm streaming compile failed: ${reason}`);
                            err('falling back to ArrayBuffer instantiation');
                            return instantiateArrayBuffer(binaryFile, imports, callback);
                        });
                    },
                );
            }
            console.log('Instantiating array buffer: ', binaryFile);

            return instantiateArrayBuffer(binaryFile, imports, callback);
        }
        function getWasmImports() {
            assignWasmImports();
            return { a: wasmImports };
        }
        function createWasm() {
            var info = getWasmImports();
            function receiveInstance(instance, module) {
                wasmExports = instance.exports;
                registerTLSInit(wasmExports['L']);
                wasmTable = wasmExports['O'];
                addOnInit(wasmExports['F']);
                wasmModule = module;
                removeRunDependency('wasm-instantiate');
                return wasmExports;
            }
            addRunDependency('wasm-instantiate');
            function receiveInstantiationResult(result) {
                receiveInstance(result['instance'], result['module']);
            }
            if (Module['instantiateWasm']) {
                try {
                    return Module['instantiateWasm'](info, receiveInstance);
                } catch (e) {
                    err(`Module.instantiateWasm callback failed with error: ${e}`);
                    readyPromiseReject(e);
                }
            }
            if (!wasmBinaryFile) wasmBinaryFile = findWasmBinary();
            instantiateAsync(
                wasmBinary,
                wasmBinaryFile,
                info,
                receiveInstantiationResult,
            ).catch(readyPromiseReject);
            return {};
        }
        function ExitStatus(status) {
            this.name = 'ExitStatus';
            this.message = `Program terminated with exit(${status})`;
            this.status = status;
        }
        var terminateWorker = (worker) => {
            worker.terminate();
            worker.onmessage = (e) => {};
        };
        var killThread = (pthread_ptr) => {
            var worker = PThread.pthreads[pthread_ptr];
            delete PThread.pthreads[pthread_ptr];
            terminateWorker(worker);
            __emscripten_thread_free_data(pthread_ptr);
            PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
            worker.pthread_ptr = 0;
        };
        var cancelThread = (pthread_ptr) => {
            var worker = PThread.pthreads[pthread_ptr];
            worker.postMessage({ cmd: 'cancel' });
        };
        var cleanupThread = (pthread_ptr) => {
            var worker = PThread.pthreads[pthread_ptr];
            PThread.returnWorkerToPool(worker);
        };
        var spawnThread = (threadParams) => {
            var worker = PThread.getNewWorker();
            if (!worker) {
                return 6;
            }
            PThread.runningWorkers.push(worker);
            PThread.pthreads[threadParams.pthread_ptr] = worker;
            worker.pthread_ptr = threadParams.pthread_ptr;
            var msg = {
                cmd: 'run',
                start_routine: threadParams.startRoutine,
                arg: threadParams.arg,
                pthread_ptr: threadParams.pthread_ptr,
            };
            worker.postMessage(msg, threadParams.transferList);
            return 0;
        };
        var runtimeKeepaliveCounter = 0;
        var keepRuntimeAlive = () => runtimeKeepaliveCounter > 0;
        var stackSave = () => _emscripten_stack_get_current();
        var stackRestore = (val) => __emscripten_stack_restore(val);
        var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
        var convertI32PairToI53Checked = (lo, hi) =>
            (hi + 2097152) >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
        var proxyToMainThread = (funcIndex, emAsmAddr, sync, ...callArgs) => {
            var serializedNumCallArgs = callArgs.length;
            var sp = stackSave();
            var args = stackAlloc(serializedNumCallArgs * 8);
            var b = args >> 3;
            for (var i = 0; i < callArgs.length; i++) {
                var arg = callArgs[i];
                GROWABLE_HEAP_F64()[b + i] = arg;
            }
            var rtn = __emscripten_run_on_main_thread_js(
                funcIndex,
                emAsmAddr,
                serializedNumCallArgs,
                args,
                sync,
            );
            stackRestore(sp);
            return rtn;
        };
        function _proc_exit(code) {
            if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 0, 1, code);
            EXITSTATUS = code;
            if (!keepRuntimeAlive()) {
                PThread.terminateAllThreads();
                ABORT = true;
            }
            quit_(code, new ExitStatus(code));
        }
        var handleException = (e) => {
            if (e instanceof ExitStatus || e == 'unwind') {
                return EXITSTATUS;
            }
            quit_(1, e);
        };
        var runtimeKeepalivePop = () => {
            runtimeKeepaliveCounter -= 1;
        };
        function exitOnMainThread(returnCode) {
            if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, 0, returnCode);
            runtimeKeepalivePop();
            _exit(returnCode);
        }
        var exitJS = (status, implicit) => {
            EXITSTATUS = status;
            if (ENVIRONMENT_IS_PTHREAD) {
                exitOnMainThread(status);
                throw 'unwind';
            }
            if (!keepRuntimeAlive()) {
                exitRuntime();
            }
            _proc_exit(status);
        };
        var _exit = exitJS;
        var PThread = {
            unusedWorkers: [],
            runningWorkers: [],
            tlsInitFunctions: [],
            pthreads: {},
            init() {
                if (ENVIRONMENT_IS_PTHREAD) {
                    PThread.initWorker();
                } else {
                    PThread.initMainThread();
                }
            },
            initMainThread() {
                var pthreadPoolSize = navigator.hardwareConcurrency;
                while (pthreadPoolSize--) {
                    PThread.allocateUnusedWorker();
                }
                addOnPreRun(() => {
                    addRunDependency('loading-workers');
                    PThread.loadWasmModuleToAllWorkers(() =>
                        removeRunDependency('loading-workers'),
                    );
                });
            },
            initWorker() {},
            setExitStatus: (status) => (EXITSTATUS = status),
            terminateAllThreads__deps: ['$terminateWorker'],
            terminateAllThreads: () => {
                for (var worker of PThread.runningWorkers) {
                    terminateWorker(worker);
                }
                for (var worker of PThread.unusedWorkers) {
                    terminateWorker(worker);
                }
                PThread.unusedWorkers = [];
                PThread.runningWorkers = [];
                PThread.pthreads = [];
            },
            returnWorkerToPool: (worker) => {
                var pthread_ptr = worker.pthread_ptr;
                delete PThread.pthreads[pthread_ptr];
                PThread.unusedWorkers.push(worker);
                PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
                worker.pthread_ptr = 0;
                __emscripten_thread_free_data(pthread_ptr);
            },
            receiveObjectTransfer(data) {},
            threadInitTLS() {
                PThread.tlsInitFunctions.forEach((f) => f());
            },
            loadWasmModuleToWorker: (worker) =>
                new Promise((onFinishedLoading) => {
                    worker.onmessage = (e) => {
                        var d = e['data'];
                        var cmd = d['cmd'];
                        if (d['targetThread'] && d['targetThread'] != _pthread_self()) {
                            var targetWorker = PThread.pthreads[d['targetThread']];
                            if (targetWorker) {
                                targetWorker.postMessage(d, d['transferList']);
                            } else {
                                err(
                                    `Internal error! Worker sent a message "${cmd}" to target pthread ${d['targetThread']}, but that thread no longer exists!`,
                                );
                            }
                            return;
                        }
                        if (cmd === 'checkMailbox') {
                            checkMailbox();
                        } else if (cmd === 'spawnThread') {
                            spawnThread(d);
                        } else if (cmd === 'cleanupThread') {
                            cleanupThread(d['thread']);
                        } else if (cmd === 'killThread') {
                            killThread(d['thread']);
                        } else if (cmd === 'cancelThread') {
                            cancelThread(d['thread']);
                        } else if (cmd === 'loaded') {
                            worker.loaded = true;
                            onFinishedLoading(worker);
                        } else if (cmd === 'alert') {
                            alert(`Thread ${d['threadId']}: ${d['text']}`);
                        } else if (d.target === 'setimmediate') {
                            worker.postMessage(d);
                        } else if (cmd === 'callHandler') {
                            Module[d['handler']](...d['args']);
                        } else if (cmd) {
                            err(`worker sent an unknown command ${cmd}`);
                        }
                    };
                    worker.onerror = (e) => {
                        var message = 'worker sent an error!';
                        err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
                        throw e;
                    };
                    var handlers = [];
                    var knownHandlers = ['print', 'printErr'];
                    for (var handler of knownHandlers) {
                        if (Module.propertyIsEnumerable(handler)) {
                            handlers.push(handler);
                        }
                    }
                    worker.postMessage({
                        cmd: 'load',
                        handlers: handlers,
                        wasmMemory: wasmMemory,
                        wasmModule: wasmModule,
                    });
                }),
            loadWasmModuleToAllWorkers(onMaybeReady) {
                if (ENVIRONMENT_IS_PTHREAD) {
                    return onMaybeReady();
                }
                let pthreadPoolReady = Promise.all(
                    PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker),
                );
                pthreadPoolReady.then(onMaybeReady);
            },
            allocateUnusedWorker() {
                var worker;
                var workerOptions = { type: 'module', name: 'em-pthread' };
                worker = new Worker(
                    new URL('sf17-79.js', import.meta.url),
                    workerOptions,
                );
                PThread.unusedWorkers.push(worker);
            },
            getNewWorker() {
                if (PThread.unusedWorkers.length == 0) {
                    PThread.allocateUnusedWorker();
                    PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
                }
                return PThread.unusedWorkers.pop();
            },
        };
        var callRuntimeCallbacks = (callbacks) => {
            while (callbacks.length > 0) {
                callbacks.shift()(Module);
            }
        };
        var establishStackSpace = () => {
            var pthread_ptr = _pthread_self();
            var stackHigh = GROWABLE_HEAP_U32()[(pthread_ptr + 52) >> 2];
            var stackSize = GROWABLE_HEAP_U32()[(pthread_ptr + 56) >> 2];
            var stackLow = stackHigh - stackSize;
            _emscripten_stack_set_limits(stackHigh, stackLow);
            stackRestore(stackHigh);
        };
        var wasmTableMirror = [];
        var wasmTable;
        var getWasmTableEntry = (funcPtr) => {
            var func = wasmTableMirror[funcPtr];
            if (!func) {
                if (funcPtr >= wasmTableMirror.length)
                    wasmTableMirror.length = funcPtr + 1;
                wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
            }
            return func;
        };
        var invokeEntryPoint = (ptr, arg) => {
            runtimeKeepaliveCounter = 0;
            var result = getWasmTableEntry(ptr)(arg);
            function finish(result) {
                if (keepRuntimeAlive()) {
                    PThread.setExitStatus(result);
                } else {
                    __emscripten_thread_exit(result);
                }
            }
            finish(result);
        };
        var registerTLSInit = (tlsInitFunc) => PThread.tlsInitFunctions.push(tlsInitFunc);
        var runtimeKeepalivePush = () => {
            runtimeKeepaliveCounter += 1;
        };
        var UTF8Decoder =
            typeof TextDecoder != 'undefined' ? new TextDecoder() : undefined;
        var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
            var endIdx = idx + maxBytesToRead;
            var endPtr = idx;
            while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
            if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
                return UTF8Decoder.decode(
                    heapOrArray.buffer instanceof SharedArrayBuffer
                        ? heapOrArray.slice(idx, endPtr)
                        : heapOrArray.subarray(idx, endPtr),
                );
            }
            var str = '';
            while (idx < endPtr) {
                var u0 = heapOrArray[idx++];
                if (!(u0 & 128)) {
                    str += String.fromCharCode(u0);
                    continue;
                }
                var u1 = heapOrArray[idx++] & 63;
                if ((u0 & 224) == 192) {
                    str += String.fromCharCode(((u0 & 31) << 6) | u1);
                    continue;
                }
                var u2 = heapOrArray[idx++] & 63;
                if ((u0 & 240) == 224) {
                    u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
                } else {
                    u0 =
                        ((u0 & 7) << 18) |
                        (u1 << 12) |
                        (u2 << 6) |
                        (heapOrArray[idx++] & 63);
                }
                if (u0 < 65536) {
                    str += String.fromCharCode(u0);
                } else {
                    var ch = u0 - 65536;
                    str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
                }
            }
            return str;
        };
        var UTF8ToString = (ptr, maxBytesToRead) =>
            ptr ? UTF8ArrayToString(GROWABLE_HEAP_U8(), ptr, maxBytesToRead) : '';
        var ___assert_fail = (condition, filename, line, func) => {
            abort(
                `Assertion failed: ${UTF8ToString(condition)}, at: ` +
                    [
                        filename ? UTF8ToString(filename) : 'unknown filename',
                        line,
                        func ? UTF8ToString(func) : 'unknown function',
                    ],
            );
        };
        function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
            return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
        }
        var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => {
            if (typeof SharedArrayBuffer == 'undefined') {
                err(
                    'Current environment does not support SharedArrayBuffer, pthreads are not available!',
                );
                return 6;
            }
            var transferList = [];
            var error = 0;
            if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
                return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
            }
            if (error) return error;
            var threadParams = {
                startRoutine: startRoutine,
                pthread_ptr: pthread_ptr,
                arg: arg,
                transferList: transferList,
            };
            if (ENVIRONMENT_IS_PTHREAD) {
                threadParams.cmd = 'spawnThread';
                postMessage(threadParams, transferList);
                return 0;
            }
            return spawnThread(threadParams);
        };
        var SYSCALLS = {
            varargs: undefined,
            getStr(ptr) {
                var ret = UTF8ToString(ptr);
                return ret;
            },
        };
        function ___syscall_fcntl64(fd, cmd, varargs) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(3, 0, 1, fd, cmd, varargs);
            SYSCALLS.varargs = varargs;
            return 0;
        }
        function ___syscall_ioctl(fd, op, varargs) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(4, 0, 1, fd, op, varargs);
            SYSCALLS.varargs = varargs;
            return 0;
        }
        function ___syscall_openat(dirfd, path, flags, varargs) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(5, 0, 1, dirfd, path, flags, varargs);
            SYSCALLS.varargs = varargs;
        }
        var __abort_js = () => {
            abort('');
        };
        var nowIsMonotonic = 1;
        var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
        var __emscripten_init_main_thread_js = (tb) => {
            __emscripten_thread_init(
                tb,
                !ENVIRONMENT_IS_WORKER,
                1,
                !ENVIRONMENT_IS_WEB,
                2097152,
                false,
            );
            PThread.threadInitTLS();
        };
        var maybeExit = () => {
            if (runtimeExited) {
                return;
            }
            if (!keepRuntimeAlive()) {
                try {
                    if (ENVIRONMENT_IS_PTHREAD) __emscripten_thread_exit(EXITSTATUS);
                    else _exit(EXITSTATUS);
                } catch (e) {
                    handleException(e);
                }
            }
        };
        var callUserCallback = (func) => {
            if (runtimeExited || ABORT) {
                return;
            }
            try {
                func();
                maybeExit();
            } catch (e) {
                handleException(e);
            }
        };
        var __emscripten_thread_mailbox_await = (pthread_ptr) => {
            if (typeof Atomics.waitAsync === 'function') {
                var wait = Atomics.waitAsync(
                    GROWABLE_HEAP_I32(),
                    pthread_ptr >> 2,
                    pthread_ptr,
                );
                wait.value.then(checkMailbox);
                var waitingAsync = pthread_ptr + 128;
                Atomics.store(GROWABLE_HEAP_I32(), waitingAsync >> 2, 1);
            }
        };
        var checkMailbox = () => {
            var pthread_ptr = _pthread_self();
            if (pthread_ptr) {
                __emscripten_thread_mailbox_await(pthread_ptr);
                callUserCallback(__emscripten_check_mailbox);
            }
        };
        var __emscripten_notify_mailbox_postmessage = (
            targetThreadId,
            currThreadId,
            mainThreadId,
        ) => {
            if (targetThreadId == currThreadId) {
                setTimeout(checkMailbox);
            } else if (ENVIRONMENT_IS_PTHREAD) {
                postMessage({ targetThread: targetThreadId, cmd: 'checkMailbox' });
            } else {
                var worker = PThread.pthreads[targetThreadId];
                if (!worker) {
                    return;
                }
                worker.postMessage({ cmd: 'checkMailbox' });
            }
        };
        var proxiedJSCallArgs = [];
        var __emscripten_receive_on_main_thread_js = (
            funcIndex,
            emAsmAddr,
            callingThread,
            numCallArgs,
            args,
        ) => {
            proxiedJSCallArgs.length = numCallArgs;
            var b = args >> 3;
            for (var i = 0; i < numCallArgs; i++) {
                proxiedJSCallArgs[i] = GROWABLE_HEAP_F64()[b + i];
            }
            var func = proxiedFunctionTable[funcIndex];
            PThread.currentProxiedOperationCallerThread = callingThread;
            var rtn = func(...proxiedJSCallArgs);
            PThread.currentProxiedOperationCallerThread = 0;
            return rtn;
        };
        function __emscripten_runtime_keepalive_clear() {
            if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 0, 1);
            runtimeKeepaliveCounter = 0;
        }
        var __emscripten_thread_cleanup = (thread) => {
            if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread);
            else postMessage({ cmd: 'cleanupThread', thread: thread });
        };
        var __emscripten_thread_set_strongref = (thread) => {};
        var timers = {};
        var _emscripten_get_now;
        _emscripten_get_now = () => performance.timeOrigin + performance.now();
        function __setitimer_js(which, timeout_ms) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(7, 0, 1, which, timeout_ms);
            if (timers[which]) {
                clearTimeout(timers[which].id);
                delete timers[which];
            }
            if (!timeout_ms) return 0;
            var id = setTimeout(() => {
                delete timers[which];
                callUserCallback(() =>
                    __emscripten_timeout(which, _emscripten_get_now()),
                );
            }, timeout_ms);
            timers[which] = { id: id, timeout_ms: timeout_ms };
            return 0;
        }
        var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
            if (!(maxBytesToWrite > 0)) return 0;
            var startIdx = outIdx;
            var endIdx = outIdx + maxBytesToWrite - 1;
            for (var i = 0; i < str.length; ++i) {
                var u = str.charCodeAt(i);
                if (u >= 55296 && u <= 57343) {
                    var u1 = str.charCodeAt(++i);
                    u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
                }
                if (u <= 127) {
                    if (outIdx >= endIdx) break;
                    heap[outIdx++] = u;
                } else if (u <= 2047) {
                    if (outIdx + 1 >= endIdx) break;
                    heap[outIdx++] = 192 | (u >> 6);
                    heap[outIdx++] = 128 | (u & 63);
                } else if (u <= 65535) {
                    if (outIdx + 2 >= endIdx) break;
                    heap[outIdx++] = 224 | (u >> 12);
                    heap[outIdx++] = 128 | ((u >> 6) & 63);
                    heap[outIdx++] = 128 | (u & 63);
                } else {
                    if (outIdx + 3 >= endIdx) break;
                    heap[outIdx++] = 240 | (u >> 18);
                    heap[outIdx++] = 128 | ((u >> 12) & 63);
                    heap[outIdx++] = 128 | ((u >> 6) & 63);
                    heap[outIdx++] = 128 | (u & 63);
                }
            }
            heap[outIdx] = 0;
            return outIdx - startIdx;
        };
        var stringToUTF8 = (str, outPtr, maxBytesToWrite) =>
            stringToUTF8Array(str, GROWABLE_HEAP_U8(), outPtr, maxBytesToWrite);
        var __tzset_js = (timezone, daylight, std_name, dst_name) => {
            var currentYear = new Date().getFullYear();
            var winter = new Date(currentYear, 0, 1);
            var summer = new Date(currentYear, 6, 1);
            var winterOffset = winter.getTimezoneOffset();
            var summerOffset = summer.getTimezoneOffset();
            var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
            GROWABLE_HEAP_U32()[timezone >> 2] = stdTimezoneOffset * 60;
            GROWABLE_HEAP_I32()[daylight >> 2] = Number(winterOffset != summerOffset);
            var extractZone = (timezoneOffset) => {
                var sign = timezoneOffset >= 0 ? '-' : '+';
                var absOffset = Math.abs(timezoneOffset);
                var hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
                var minutes = String(absOffset % 60).padStart(2, '0');
                return `UTC${sign}${hours}${minutes}`;
            };
            var winterName = extractZone(winterOffset);
            var summerName = extractZone(summerOffset);
            if (summerOffset < winterOffset) {
                stringToUTF8(winterName, std_name, 17);
                stringToUTF8(summerName, dst_name, 17);
            } else {
                stringToUTF8(winterName, dst_name, 17);
                stringToUTF8(summerName, std_name, 17);
            }
        };
        var warnOnce = (text) => {
            warnOnce.shown ||= {};
            if (!warnOnce.shown[text]) {
                warnOnce.shown[text] = 1;
                err(text);
            }
        };
        var _emscripten_check_blocking_allowed = () => {
            if (ENVIRONMENT_IS_WORKER) return;
            warnOnce(
                'Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread',
            );
            abort(
                'Blocking on the main thread is not allowed by default. See https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread',
            );
        };
        var _emscripten_exit_with_live_runtime = () => {
            runtimeKeepalivePush();
            throw 'unwind';
        };
        var _emscripten_num_logical_cores = () => navigator['hardwareConcurrency'];
        var getHeapMax = () => 2147483648;
        var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
        var growMemory = (size) => {
            var b = wasmMemory.buffer;
            var pages = (size - b.byteLength + 65535) / 65536;
            try {
                wasmMemory.grow(pages);
                updateMemoryViews();
                return 1;
            } catch (e) {}
        };
        var _emscripten_resize_heap = (requestedSize) => {
            var oldSize = GROWABLE_HEAP_U8().length;
            requestedSize >>>= 0;
            if (requestedSize <= oldSize) {
                return false;
            }
            var maxHeapSize = getHeapMax();
            if (requestedSize > maxHeapSize) {
                return false;
            }
            for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
                var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
                overGrownHeapSize = Math.min(
                    overGrownHeapSize,
                    requestedSize + 100663296,
                );
                var newSize = Math.min(
                    maxHeapSize,
                    alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536),
                );
                var replacement = growMemory(newSize);
                if (replacement) {
                    return true;
                }
            }
            return false;
        };
        var _emscripten_runtime_keepalive_check = keepRuntimeAlive;
        var ENV = {};
        var getExecutableName = () => thisProgram || './this.program';
        var getEnvStrings = () => {
            if (!getEnvStrings.strings) {
                var lang =
                    (
                        (typeof navigator == 'object' &&
                            navigator.languages &&
                            navigator.languages[0]) ||
                        'C'
                    ).replace('-', '_') + '.UTF-8';
                var env = {
                    USER: 'web_user',
                    LOGNAME: 'web_user',
                    PATH: '/',
                    PWD: '/',
                    HOME: '/home/web_user',
                    LANG: lang,
                    _: getExecutableName(),
                };
                for (var x in ENV) {
                    if (ENV[x] === undefined) delete env[x];
                    else env[x] = ENV[x];
                }
                var strings = [];
                for (var x in env) {
                    strings.push(`${x}=${env[x]}`);
                }
                getEnvStrings.strings = strings;
            }
            return getEnvStrings.strings;
        };
        var stringToAscii = (str, buffer) => {
            for (var i = 0; i < str.length; ++i) {
                GROWABLE_HEAP_I8()[buffer++] = str.charCodeAt(i);
            }
            GROWABLE_HEAP_I8()[buffer] = 0;
        };
        var _environ_get = function (__environ, environ_buf) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(8, 0, 1, __environ, environ_buf);
            var bufSize = 0;
            getEnvStrings().forEach((string, i) => {
                var ptr = environ_buf + bufSize;
                GROWABLE_HEAP_U32()[(__environ + i * 4) >> 2] = ptr;
                stringToAscii(string, ptr);
                bufSize += string.length + 1;
            });
            return 0;
        };
        var _environ_sizes_get = function (penviron_count, penviron_buf_size) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(9, 0, 1, penviron_count, penviron_buf_size);
            var strings = getEnvStrings();
            GROWABLE_HEAP_U32()[penviron_count >> 2] = strings.length;
            var bufSize = 0;
            strings.forEach((string) => (bufSize += string.length + 1));
            GROWABLE_HEAP_U32()[penviron_buf_size >> 2] = bufSize;
            return 0;
        };
        function _fd_close(fd) {
            if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 0, 1, fd);
            return 52;
        }
        function _fd_read(fd, iov, iovcnt, pnum) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(11, 0, 1, fd, iov, iovcnt, pnum);
            return 52;
        }
        function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(
                    12,
                    0,
                    1,
                    fd,
                    offset_low,
                    offset_high,
                    whence,
                    newOffset,
                );
            var offset = convertI32PairToI53Checked(offset_low, offset_high);
            return 70;
        }
        var printCharBuffers = [null, [], []];
        var printChar = (stream, curr) => {
            var buffer = printCharBuffers[stream];
            if (curr === 0 || curr === 10) {
                (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
                buffer.length = 0;
            } else {
                buffer.push(curr);
            }
        };
        var flush_NO_FILESYSTEM = () => {
            _fflush(0);
            if (printCharBuffers[1].length) printChar(1, 10);
            if (printCharBuffers[2].length) printChar(2, 10);
        };
        function _fd_write(fd, iov, iovcnt, pnum) {
            if (ENVIRONMENT_IS_PTHREAD)
                return proxyToMainThread(13, 0, 1, fd, iov, iovcnt, pnum);
            var num = 0;
            for (var i = 0; i < iovcnt; i++) {
                var ptr = GROWABLE_HEAP_U32()[iov >> 2];
                var len = GROWABLE_HEAP_U32()[(iov + 4) >> 2];
                iov += 8;
                for (var j = 0; j < len; j++) {
                    printChar(fd, GROWABLE_HEAP_U8()[ptr + j]);
                }
                num += len;
            }
            GROWABLE_HEAP_U32()[pnum >> 2] = num;
            return 0;
        }
        var lengthBytesUTF8 = (str) => {
            var len = 0;
            for (var i = 0; i < str.length; ++i) {
                var c = str.charCodeAt(i);
                if (c <= 127) {
                    len++;
                } else if (c <= 2047) {
                    len += 2;
                } else if (c >= 55296 && c <= 57343) {
                    len += 4;
                    ++i;
                } else {
                    len += 3;
                }
            }
            return len;
        };
        var stringToUTF8OnStack = (str) => {
            var size = lengthBytesUTF8(str) + 1;
            var ret = stackAlloc(size);
            stringToUTF8(str, ret, size);
            return ret;
        };
        PThread.init();
        var proxiedFunctionTable = [
            _proc_exit,
            exitOnMainThread,
            pthreadCreateProxied,
            ___syscall_fcntl64,
            ___syscall_ioctl,
            ___syscall_openat,
            __emscripten_runtime_keepalive_clear,
            __setitimer_js,
            _environ_get,
            _environ_sizes_get,
            _fd_close,
            _fd_read,
            _fd_seek,
            _fd_write,
        ];
        var wasmImports;
        function assignWasmImports() {
            wasmImports = {
                b: ___assert_fail,
                D: ___pthread_create_js,
                g: ___syscall_fcntl64,
                y: ___syscall_ioctl,
                z: ___syscall_openat,
                n: __abort_js,
                E: __emscripten_get_now_is_monotonic,
                l: __emscripten_init_main_thread_js,
                C: __emscripten_notify_mailbox_postmessage,
                j: __emscripten_receive_on_main_thread_js,
                r: __emscripten_runtime_keepalive_clear,
                h: __emscripten_thread_cleanup,
                k: __emscripten_thread_mailbox_await,
                f: __emscripten_thread_set_strongref,
                s: __setitimer_js,
                u: __tzset_js,
                i: _emscripten_check_blocking_allowed,
                m: _emscripten_exit_with_live_runtime,
                d: _emscripten_get_now,
                t: _emscripten_num_logical_cores,
                B: _emscripten_resize_heap,
                o: _emscripten_runtime_keepalive_check,
                v: _environ_get,
                w: _environ_sizes_get,
                c: _exit,
                e: _fd_close,
                x: _fd_read,
                p: _fd_seek,
                A: _fd_write,
                a: wasmMemory,
                q: _proc_exit,
            };
        }
        var wasmExports = createWasm();
        var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports['F'])();
        var _main = (Module['_main'] = (a0, a1) =>
            (_main = Module['_main'] = wasmExports['G'])(a0, a1));
        var __Z10js_getlinev = (Module['__Z10js_getlinev'] = (a0) =>
            (__Z10js_getlinev = Module['__Z10js_getlinev'] = wasmExports['H'])(a0));
        var _uci = (Module['_uci'] = (a0) =>
            (_uci = Module['_uci'] = wasmExports['I'])(a0));
        var _setNnueBuffer = (Module['_setNnueBuffer'] = (a0, a1, a2) =>
            (_setNnueBuffer = Module['_setNnueBuffer'] = wasmExports['J'])(a0, a1, a2));
        var _getRecommendedNnue = (Module['_getRecommendedNnue'] = (a0) =>
            (_getRecommendedNnue = Module['_getRecommendedNnue'] = wasmExports['K'])(a0));
        var __emscripten_tls_init = () => (__emscripten_tls_init = wasmExports['L'])();
        var _pthread_self = () => (_pthread_self = wasmExports['M'])();
        var __emscripten_proxy_main = (Module['__emscripten_proxy_main'] = (a0, a1) =>
            (__emscripten_proxy_main = Module['__emscripten_proxy_main'] =
                wasmExports['N'])(a0, a1));
        var ___funcs_on_exit = () => (___funcs_on_exit = wasmExports['P'])();
        var __emscripten_thread_init = (a0, a1, a2, a3, a4, a5) =>
            (__emscripten_thread_init = wasmExports['Q'])(a0, a1, a2, a3, a4, a5);
        var __emscripten_thread_crashed = () =>
            (__emscripten_thread_crashed = wasmExports['R'])();
        var _fflush = (a0) => (_fflush = wasmExports['S'])(a0);
        var _malloc = (Module['_malloc'] = (a0) =>
            (_malloc = Module['_malloc'] = wasmExports['T'])(a0));
        var __emscripten_run_on_main_thread_js = (a0, a1, a2, a3, a4) =>
            (__emscripten_run_on_main_thread_js = wasmExports['U'])(a0, a1, a2, a3, a4);
        var __emscripten_thread_free_data = (a0) =>
            (__emscripten_thread_free_data = wasmExports['V'])(a0);
        var __emscripten_thread_exit = (a0) =>
            (__emscripten_thread_exit = wasmExports['W'])(a0);
        var __emscripten_timeout = (a0, a1) =>
            (__emscripten_timeout = wasmExports['X'])(a0, a1);
        var __emscripten_check_mailbox = () =>
            (__emscripten_check_mailbox = wasmExports['Y'])();
        var _emscripten_stack_set_limits = (a0, a1) =>
            (_emscripten_stack_set_limits = wasmExports['Z'])(a0, a1);
        var __emscripten_stack_restore = (a0) =>
            (__emscripten_stack_restore = wasmExports['_'])(a0);
        var __emscripten_stack_alloc = (a0) =>
            (__emscripten_stack_alloc = wasmExports['$'])(a0);
        var _emscripten_stack_get_current = () =>
            (_emscripten_stack_get_current = wasmExports['aa'])();
        Module['UTF8ToString'] = UTF8ToString;
        Module['stringToUTF8'] = stringToUTF8;
        var calledRun;
        dependenciesFulfilled = function runCaller() {
            if (!calledRun) run();
            if (!calledRun) dependenciesFulfilled = runCaller;
        };
        function callMain(args = []) {
            var entryFunction = __emscripten_proxy_main;
            runtimeKeepalivePush();
            args.unshift(thisProgram);
            var argc = args.length;
            var argv = stackAlloc((argc + 1) * 4);
            var argv_ptr = argv;
            args.forEach((arg) => {
                GROWABLE_HEAP_U32()[argv_ptr >> 2] = stringToUTF8OnStack(arg);
                argv_ptr += 4;
            });
            GROWABLE_HEAP_U32()[argv_ptr >> 2] = 0;
            try {
                var ret = entryFunction(argc, argv);
                exitJS(ret, true);
                return ret;
            } catch (e) {
                return handleException(e);
            }
        }
        function run(args = arguments_) {
            if (runDependencies > 0) {
                return;
            }
            if (ENVIRONMENT_IS_PTHREAD) {
                readyPromiseResolve(Module);
                initRuntime();
                startWorker(Module);
                return;
            }
            preRun();
            if (runDependencies > 0) {
                return;
            }
            function doRun() {
                if (calledRun) return;
                calledRun = true;
                Module['calledRun'] = true;
                if (ABORT) return;
                initRuntime();
                preMain();
                readyPromiseResolve(Module);
                if (shouldRunNow) callMain(args);
                postRun();
            }
            {
                doRun();
            }
        }
        var shouldRunNow = true;
        run();
        moduleRtn = readyPromise;

        return moduleRtn;
    };
})();
export default Sf1779Web;
var isPthread = globalThis.self?.name === 'em-pthread';
// When running as a pthread, construct a new instance on startup
isPthread && Sf1779Web();
