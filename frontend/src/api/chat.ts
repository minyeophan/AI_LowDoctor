<<<<<<< HEAD
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export interface ChatResponse {
  success: boolean;
  answer: string;
  references?: {
    terms?: any[];
    knowledge?: any[];
    laws?: any[];
    interpretations?: any[];
    cases?: any[];
  };
}

export const chatAPI = {
  async ask(question: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "챗봇 요청 실패");
    }

    return data;
  },
};
=======
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
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
