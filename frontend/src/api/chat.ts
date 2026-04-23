import { apiClient } from "./client";
export interface ChatResponse {
  answer: string;
}
export interface ChatHistory {
  documentId: string;
  messages: { role: string; content: string }[];
}
export async function getChatHistory(documentId: string): Promise<ChatHistory> {
  return apiClient<ChatHistory>(`/api/chat/${documentId}`);
}
export async function sendChatMessage(documentId: string, question: string): Promise<ChatResponse> {
  return apiClient<ChatResponse>(`/api/chat/${documentId}/exchange`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
export async function deleteChatHistory(documentId: string): Promise<void> {
  return apiClient<void>(`/api/chat/${documentId}`, {
    method: "DELETE",
  });
}