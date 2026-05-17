import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";

const stockfishPath = process.env.STOCKFISH_PATH
  ?? path.join(__dirname, "../../engines/stockfish.exe");

export function createStockfishProcess(): Promise<ChildProcessWithoutNullStreams> {
  return new Promise((resolve, reject) => {
    const sf = spawn(stockfishPath);

    sf.on("error", (e) => {
      console.error("Stockfish failed to start:", e);
      reject(e);
    });

    sf.stdin.write("uci\n");
    sf.stdin.write("isready\n");

    const handler = (data: Buffer) => {
      if (data.toString().includes("readyok")) {
        sf.stdout.off("data", handler);
        resolve(sf);
      }
    };

    sf.stdout.on("data", handler);
  });
}

// Returns eval from white's perspective (positive = white winning, negative = black winning)
export function getEval(
  process: ChildProcessWithoutNullStreams,
  fen: string,
  depth: number = 15
): Promise<number> {
  // Stockfish scores from the side-to-move's perspective; track whose turn it is so we can normalize
  const sideToMove = fen.split(" ")[1]; // "w" or "b"

  return new Promise((resolve) => {
    process.stdin.write(`position fen ${fen}\n`);
    process.stdin.write(`go depth ${depth}\n`);

    let resolved = false;
    const handler = (data: Buffer) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (resolved) break;
        if (line.startsWith("bestmove")) {
          process.stdout.off("data", handler);
          resolved = true;
          // Negate when it's black to move so the result is always from white's perspective
          resolve(sideToMove === "b" ? -lastEval : lastEval);
        } else if (line.includes("score cp")) {
          const match = line.match(/score cp (-?\d+)/);
          if (match) lastEval = parseInt(match[1]) / 100;
        } else if (line.includes("score mate")) {
          const match = line.match(/score mate (-?\d+)/);
          if (match) lastEval = parseInt(match[1]) > 0 ? 999 : -999;
        }
      }
    };

    let lastEval = 0;
    process.stdout.on("data", handler);
  });
}

// Returns both best move and eval in one go command (for vs Stockfish games)
export function getBestMoveAndEval(
  process: ChildProcessWithoutNullStreams,
  fen: string,
  skillLevel: number // 0–20
): Promise<{ bestMove: string; evaluation: number }> {
  return new Promise((resolve) => {
    process.stdin.write(`setoption name Skill Level value ${skillLevel}\n`);
    process.stdin.write(`position fen ${fen}\n`);
    process.stdin.write(`go depth 15\n`); // fixed depth, skill level controls strength

    let lastEval = 0;
    let resolved = false;

    const handler = (data: Buffer) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (resolved) break;
        if (line.includes("score cp")) {
          const match = line.match(/score cp (-?\d+)/);
          if (match) lastEval = parseInt(match[1]) / 100;
        } else if (line.includes("score mate")) {
          const match = line.match(/score mate (-?\d+)/);
          if (match) lastEval = parseInt(match[1]) > 0 ? 999 : -999;
        } else if (line.startsWith("bestmove")) {
          const bestMove = line.split(" ")[1];
          process.stdout.off("data", handler);
          resolved = true;
          resolve({ bestMove, evaluation: lastEval });
        }
      }
    };

    process.stdout.on("data", handler);
  });
}