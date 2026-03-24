import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type CommentaryTrigger =
  | "opening"
  | "blunder"
  | "brilliant"
  | "eval_shift"
  | "draw_offer"
  | "checkmate";

export function initCommentary(style?: string | null): ChatSession {
  const systemInstruction = style
    ? `You are a chess commentator. ${style}. Keep all responses to 1-2 sentences.`
    : "You are an enthusiastic and insightful chess commentator. Keep all responses to 1-2 sentences.";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
  });

  return model.startChat();
}

export async function getCommentary(
  chat: ChatSession,
  params: {
    fen: string;
    move: string;
    trigger: CommentaryTrigger;
    evalBefore: number;
    evalAfter: number;
  }
): Promise<string> {
  const { fen, move, trigger, evalBefore, evalAfter } = params;

  const prompt = `
Position (FEN): ${fen}
Move played: ${move}
Eval before: ${evalBefore}, Eval after: ${evalAfter}
Trigger: ${trigger}

React to this moment.
`;

  const result = await chat.sendMessage(prompt);
  return result.response.text();
}