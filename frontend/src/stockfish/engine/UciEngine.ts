import { EngineWorker } from './EngineWorker';
import { EngineName, EvaluatePositionWithUpdateParams, PositionEval } from './engine';
import { getResultProperty, parseEvaluationResults } from './parseResults';

export abstract class UciEngine {
    protected worker: EngineWorker | undefined;
    private ready = false;
    private engineName: EngineName;
    private multiPv = 3;
    private skillLevel: number | undefined = undefined;

    /**
     * Gets an EngineWorker from the given stockfish.js path.
     * @param path The stockfish.js path to create an EngineWorker from.
     * @returns An EngineWorker using the given stockfish.js path.
     */
    public static workerFromPath(path: string): EngineWorker {
        const worker = new Worker(path);

        const engineWorker: EngineWorker = {
            uci(command) {
                worker.postMessage(command);
            },
            listen(data) {
                console.log(data);
            },
            onError(msg) {
                console.error(msg);
            },
            terminate() {
                worker.terminate();
            },
        };

        worker.onmessage = (event) => {
            engineWorker.listen(event.data as string);
        };
        worker.onerror = (err) => {
            engineWorker.onError(err);
        };

        return engineWorker;
    }

    /**
     * Constructs a new UciEngine instance.
     * @param engineName The name of the engine.
     * @param worker The engine worker.
     */
    constructor(engineName: EngineName, worker?: EngineWorker) {
        this.engineName = engineName;
        this.worker = worker;
        console.log(`${engineName} created`);
    }

    /**
     * Initializes the engine. This must be called before evaluating any positions.
     */
    public async init(): Promise<void> {
        if (this.worker) {
            await this.sendCommands(['uci'], 'uciok');
            await this.setMultiPv(this.multiPv, true);
            this.ready = true;
            console.log(`${this.engineName} initialized`);
        }
    }

    /**
     * Sends the given UCI commands and resolves once the expected final message is returned.
     * @param commands The commands to send to the engine.
     * @param finalMessage The final message to wait for.
     * @param onNewMessage An optional function called with each new message from the engine.
     * @returns A Promise that resolves with all engine messages once finalMessage is detected.
     */
    protected async sendCommands(
        commands: string[],
        finalMessage: string,
        onNewMessage?: (messages: string[]) => void,
    ): Promise<string[]> {
        return new Promise((resolve) => {
            if (!this.worker) {
                return [];
            }

            const messages: string[] = [];

            this.worker.listen = (messageData) => {
                console.log('UCI message: ', messageData);
                messages.push(messageData);
                onNewMessage?.(messages);

                if (messageData.startsWith(finalMessage)) {
                    resolve(messages);
                }
            };

            for (const command of commands) {
                console.log('Posting message: ', command);
                this.worker.uci(command);
            }
        });
    }

    /**
     * Sets the multiPv (number of lines) option. See https://disservin.github.io/stockfish-docs/stockfish-wiki/Terminology.html#multiple-pvs.
     * @param multiPv The number of lines to set. Must be in the range [2, 6].
     * @param forceInit If true, the option is set even if multiPv is equal to this.multiPv. If false, an error is thrown if the engine is not ready.
     * @returns A Promise that resolves once the engine is ready.
     */
    private async setMultiPv(multiPv: number, forceInit = false) {
        if (!forceInit) {
            if (multiPv === this.multiPv) return;

            this.throwErrorIfNotReady();
        }

        if (multiPv < 2 || multiPv > 6) {
            throw new Error(`Invalid MultiPV value : ${multiPv}`);
        }

        await this.sendCommands(
            [`setoption name MultiPV value ${multiPv}`, 'isready'],
            'readyok',
        );

        this.multiPv = multiPv;
    }

    /**
     * Sets the skill level of the engine.
     * @param skillLevel The skill level of the engine. Must be in the range [0, 20].
     * @param forceInit Whether to force initialization if skillLevel is equal to this.skillLevel. If false, an error is thrown if the engine is not ready.
     * @returns A Promise that resolves once the engine is ready.
     */
    private async setSkillLevel(skillLevel: number, forceInit = false) {
        if (!forceInit) {
            if (skillLevel === this.skillLevel) return;

            this.throwErrorIfNotReady();
        }

        if (skillLevel < 0 || skillLevel > 20) {
            throw new Error(`Invalid SkillLevel value : ${skillLevel}`);
        }

        await this.sendCommands(
            [`setoption name Skill Level value ${skillLevel}`, 'isready'],
            'readyok',
        );

        this.skillLevel = skillLevel;
    }

    /**
     * Throws an error if the engine is not ready.
     */
    private throwErrorIfNotReady() {
        if (!this.ready) {
            throw new Error(`${this.engineName} is not ready`);
        }
    }

    /**
     * Shuts down the engine and terminates the worker running it.
     */
    public shutdown(): void {
        this.ready = false;
        this.worker?.uci('quit');
        this.worker?.terminate?.();
        console.log(`${this.engineName} shutdown`);
    }

    /**
     * @returns True if the engine is ready.
     */
    public isReady(): boolean {
        return this.ready;
    }

    /**
     * Stops calculating as soon as possible.
     * @returns A Promise that resolves once the engine has stopped.
     */
    public async stopSearch(): Promise<void> {
        await this.sendCommands(['stop', 'isready'], 'readyok');
    }

    /**
     * Evaluates the given position, updating the eval as the engine runs.
     * @param fen The FEN to evaluate.
     * @param depth The depth to use when evaluating.
     * @param multiPv The number of lines to analyze.
     * @param setPartialEval The callback function that is sent eval updates.
     * @returns The engine's final PositionEval.
     */
    public async evaluatePositionWithUpdate({
        fen,
        depth = 16,
        multiPv = this.multiPv,
        setPartialEval,
    }: EvaluatePositionWithUpdateParams): Promise<PositionEval> {
        depth = 95;

        this.throwErrorIfNotReady();

        await this.stopSearch();
        await this.setMultiPv(multiPv);

        const whiteToPlay = fen.split(' ')[1] === 'w';

        const onNewMessage = (messages: string[]) => {
            const parsedResults = parseEvaluationResults(fen, messages, whiteToPlay);
            setPartialEval?.(parsedResults);
        };

        console.log(`Evaluating position: ${fen}`);

        const results = await this.sendCommands(
            [`position fen ${fen}`, `go depth ${depth}`],
            'bestmove',
            onNewMessage,
        );
        return parseEvaluationResults(fen, results, whiteToPlay);
    }

    /**
     * Returns the engine's best move or undefined if no moves are found.
     * @param fen The FEN to get the move from.
     * @param skillLevel The skill level of the engine.
     * @param depth The depth to evaluate.
     * @returns The engine's best move or undefined if no moves are found.
     */
    public async getEngineNextMove(
        fen: string,
        skillLevel: number,
        depth = 16,
    ): Promise<string | undefined> {
        this.throwErrorIfNotReady();
        await this.setSkillLevel(skillLevel);

        console.log(`Evaluating position: ${fen}`);

        const results = await this.sendCommands(
            [`position fen ${fen}`, `go depth ${depth}`],
            'bestmove',
        );

        const moveResult = results.find((result) => result.startsWith('bestmove'));
        const move = getResultProperty(moveResult ?? '', 'bestmove');
        if (!move) {
            throw new Error('No move found');
        }

        return move === '(none)' ? undefined : move;
    }
}