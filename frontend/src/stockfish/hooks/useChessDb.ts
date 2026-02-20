import { useState, useCallback, useEffect } from "react";
import { getChessDbCache, setChessDbCache } from "@/api/cache/chessdb";
import { validateFen } from "chess.js";
import { ChessDbMove } from "@/api/cache/chessdb";
import { useChess } from "@/board/pgn/PgnBoard";

interface ChessDbResponse {
  status: string;
  moves: ChessDbMove[];
}

interface ChessDbPvResponse {
  status: string;
  score: number;
  depth: number;
  pv: string[];
  pvSAN: string[];
}

export interface ChessDbPv {
  score: number;
  depth: number;
  pv: string[];
  pvSAN: string[];
}

export function getChessDbNoteWord(note: string): string {
  switch (note) {
    case "!":
      return "Best";
    case "*":
      return "Good";
    case "?":
      return "Bad";
    default:
      return "unknown";
  }
}

export function useChessDB() {
  const { chess } = useChess();
  const [data, setData] = useState<ChessDbMove[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueing, setQueueing] = useState(false);
  const [pv, setPv] = useState<ChessDbPv | null>(null);
  const [pvLoading, setPvLoading] = useState(false);
  const [pvError, setPvError] = useState<string | null>(null);

  const fen = chess?.fen() ?? "";

  const queueAnalysis = useCallback(async (fenString: string): Promise<void> => {
    if (!fenString.trim() || !validateFen(fenString)) return;
    setQueueing(true);
    try {
      const encodedFen = encodeURIComponent(fenString);
      const queueUrl = `https://www.chessdb.cn/cdb.php?action=queue&board=${encodedFen}&json=1`;
      const response = await fetch(queueUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to queue analysis`);
      }
      const responseData = (await response.json()) as { status: string };
      if (responseData.status !== "ok") {
        throw new Error(`Failed to queue position: ${responseData.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue analysis");
    } finally {
      setQueueing(false);
    }
  }, []);

  const fetchPv = useCallback(async (fenString: string): Promise<ChessDbPv | null> => {
    if (!fenString.trim() || !validateFen(fenString)) return null;

    setPvLoading(true);
    setPvError(null);

    try {
      const encodedFen = encodeURIComponent(fenString);
      const pvUrl = `https://www.chessdb.cn/cdb.php?action=querypv&board=${encodedFen}&json=1`;
      const response = await fetch(pvUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch PV`);
      }

      const responseData = (await response.json()) as ChessDbPvResponse;
      if (responseData.status !== "ok") {
        setPv(null);
        return null;
      }

      const pvData: ChessDbPv = {
        score: responseData.score,
        depth: responseData.depth,
        pv: responseData.pv ?? [],
        pvSAN: responseData.pvSAN ?? [],
      };

      setPv(pvData);
      return pvData;
    } catch (err) {
      setPvError(err instanceof Error ? err.message : "Failed to fetch PV");
      setPv(null);
      return null;
    } finally {
      setPvLoading(false);
    }
  }, []);

  const fetchChessDBData = useCallback(
    async (fenString: string): Promise<ChessDbMove[]> => {
      if (!fenString.trim()) {
        setData([]);
        setError(null);
        return [];
      }
      if (!validateFen(fenString)) {
        setError("Invalid FEN provided");
        setData([]);
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const cached = (await getChessDbCache(fenString)) as ChessDbMove[] | null;
        if (cached) {
          setData(cached);
          return cached;
        }

        const encodedFen = encodeURIComponent(fenString);
        const apiUrl = `https://www.chessdb.cn/cdb.php?action=queryall&board=${encodedFen}&json=1`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch data`);
        }

        const responseData = (await response.json()) as ChessDbResponse;
        if (responseData.status !== "ok") {
          await queueAnalysis(fenString);
          return [];
        }

        const moves = responseData.moves;
        if (!Array.isArray(moves) || moves.length === 0) {
          setData([]);
          return [];
        }

        const processedMoves: ChessDbMove[] = moves.map((move: ChessDbMove) => {
          const scoreNum = Number(move.score);
          const scoreStr = isNaN(scoreNum) ? "N/A" : (scoreNum / 100).toFixed(2);
          return {
            uci: move.uci || "N/A",
            san: move.san || "N/A",
            score: scoreStr,
            winrate: move.winrate || "N/A",
            rank: move.rank,
            note: getChessDbNoteWord(move.note.split(" ")[0] ?? ""),
            rawEval: scoreNum,
          };
        });

        await setChessDbCache(fenString, processedMoves);
        setData(processedMoves);
        return processedMoves;
      } catch (err) {
        setData([]);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [queueAnalysis]
  );

  useEffect(() => {
    if (!chess || !fen) return;
    void fetchChessDBData(fen);
    void fetchPv(fen);
  }, [fen, chess, fetchChessDBData, fetchPv]);

  const refetch = useCallback(() => {
    if (!fen) return;
    void fetchChessDBData(fen);
    void fetchPv(fen);
  }, [fen, fetchChessDBData, fetchPv]);

  const requestAnalysis = useCallback(() => {
    if (!fen) return;
    void queueAnalysis(fen);
  }, [fen, queueAnalysis]);

  const refetchPv = useCallback(() => {
    if (!fen) return;
    void fetchPv(fen);
  }, [fen, fetchPv]);

  return {
    data,
    loading,
    error,
    queueing,
    fetchChessDBData,
    refetch,
    requestAnalysis,
    pv,
    pvLoading,
    pvError,
    fetchPv,
    refetchPv,
  };
}