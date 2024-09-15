
import { EngineName } from "./EngineEnum";
import {
  EvaluatePositionWithUpdateParams,
  PositionEval,
} from "./EngineEval";
import {
  getResultProperty,
  parseEvaluationResults,
} from "./Helper";

import { getLichessEval } from "./LichessCloud";

export abstract class UciEngine {
  private worker: Worker;
  private ready = false;
  private engineName: EngineName;
  private multiPv = 3;
  private skillLevel: number | undefined = undefined;
  private customEngineInit?: () => Promise<void>;

  constructor(
    engineName: EngineName,
    enginePath: string,
    customEngineInit?: () => Promise<void>
  ) {
    this.engineName = engineName;
    this.worker = new Worker(enginePath);
    this.customEngineInit = customEngineInit;

    console.log(`${engineName} created`);
  }

  public async init(): Promise<void> {
    await this.sendCommands(["uci"], "uciok");
    await this.setMultiPv(this.multiPv, true);
    await this.customEngineInit?.();
    this.ready = true;
    console.log(`${this.engineName} initialized`);
  }

  private async setMultiPv(multiPv: number, initCase = false) {
    if (!initCase) {
      if (multiPv === this.multiPv) return;

      this.throwErrorIfNotReady();
    }

    if (multiPv < 2 || multiPv > 6) {
      throw new Error(`Invalid MultiPV value : ${multiPv}`);
    }

    await this.sendCommands(
      [`setoption name MultiPV value ${multiPv}`, "isready"],
      "readyok"
    );

    this.multiPv = multiPv;
  }

  private async setSkillLevel(skillLevel: number, initCase = false) {
    if (!initCase) {
      if (skillLevel === this.skillLevel) return;

      this.throwErrorIfNotReady();
    }

    if (skillLevel < 0 || skillLevel > 20) {
      throw new Error(`Invalid SkillLevel value : ${skillLevel}`);
    }

    await this.sendCommands(
      [`setoption name Skill Level value ${skillLevel}`, "isready"],
      "readyok"
    );

    this.skillLevel = skillLevel;
  }

  private throwErrorIfNotReady() {
    if (!this.ready) {
      throw new Error(`${this.engineName} is not ready`);
    }
  }

  public shutdown(): void {
    this.ready = false;
    this.worker.postMessage("quit");
    this.worker.terminate();
    console.log(`${this.engineName} shutdown`);
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async stopSearch(): Promise<void> {
    await this.sendCommands(["stop", "isready"], "readyok");
  }

  protected async sendCommands(
    commands: string[],
    finalMessage: string,
    onNewMessage?: (messages: string[]) => void
  ): Promise<string[]> {
    return new Promise((resolve) => {
      const messages: string[] = [];

      this.worker.onmessage = (event) => {
        const messageData: string = event.data;
        messages.push(messageData);
        onNewMessage?.(messages);

        if (messageData.startsWith(finalMessage)) {
          resolve(messages);
        }
      };

      for (const command of commands) {
        this.worker.postMessage(command);
      }
    });
  }


  private async evaluatePosition(
    fen: string,
    depth = 16
  ): Promise<PositionEval> {
    console.log(`Evaluating position: ${fen}`);

    const lichessEval = await getLichessEval(fen, this.multiPv);
    if (
      lichessEval.lines.length >= this.multiPv &&
      lichessEval.lines[0].depth >= depth
    ) {
      return lichessEval;
    }

    const results = await this.sendCommands(
      [`position fen ${fen}`, `go depth ${depth}`],
      "bestmove"
    );

    const whiteToPlay = fen.split(" ")[1] === "w";

    return parseEvaluationResults(results, whiteToPlay);
  }

  public async evaluatePositionWithUpdate({
    fen,
    depth = 16,
    multiPv = this.multiPv,
    setPartialEval,
  }: EvaluatePositionWithUpdateParams): Promise<void> {
    this.throwErrorIfNotReady();

    const lichessEvalPromise = getLichessEval(fen, multiPv);

    await this.stopSearch();
    await this.setMultiPv(multiPv);

    const whiteToPlay = fen.split(" ")[1] === "w";

    const onNewMessage = (messages: string[]) => {
      const parsedResults = parseEvaluationResults(messages, whiteToPlay);
      setPartialEval(parsedResults);
    };

    console.log(`Evaluating position: ${fen}`);

    const lichessEval = await lichessEvalPromise;
    if (
      lichessEval.lines.length >= multiPv &&
      lichessEval.lines[0].depth >= depth
    ) {
      setPartialEval(lichessEval);
      return;
    }

    await this.sendCommands(
      [`position fen ${fen}`, `go depth ${depth}`],
      "bestmove",
      onNewMessage
    );
  }

  public async getEngineNextMove(
    fen: string,
    skillLevel: number,
    depth = 16
  ): Promise<string | undefined> {
    this.throwErrorIfNotReady();
    await this.setSkillLevel(skillLevel);

    console.log(`Evaluating position: ${fen}`);

    const results = await this.sendCommands(
      [`position fen ${fen}`, `go depth ${depth}`],
      "bestmove"
    );

    const moveResult = results.find((result) => result.startsWith("bestmove"));
    const move = getResultProperty(moveResult ?? "", "bestmove");
    if (!move) {
      throw new Error("No move found");
    }

    return move === "(none)" ? undefined : move;
  }
}