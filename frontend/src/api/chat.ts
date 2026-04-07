import { apiClient } from "./client";

export interface ChatResponse {
  answer: string;
}

export async function sendChatMessage(question: string): Promise<ChatResponse> {
  return apiClient<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}