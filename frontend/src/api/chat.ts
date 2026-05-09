import { apiClient } from "./client";

export const GENERAL_CHAT_ID = "__general__";

export interface ChatResponse {
  answer: string;
}

export interface ChatMessage {
  id?: string | null;
  role: string;
  content: string;
  createdAt?: string;
}

export interface ChatHistory {
  id?: string | null;
  documentId: string;
  title?: string;
  resultId?: string | null;
  lastMessageAt?: string | null;
  messages: ChatMessage[];
  answer?: string;
}

/**
 * 채팅 기록은 항상 __general__ 기준으로 조회한다.
 * 문서가 업로드되어도 기존 챗봇 내역이 사라지지 않게 하기 위함.
 */
export async function getChatHistory(): Promise<ChatHistory> {
  return apiClient<ChatHistory>(`/api/chat/${GENERAL_CHAT_ID}`);
}

/**
 * 채팅 저장은 항상 __general__에 저장한다.
 *
 * documentId는 URL에 쓰지 않고 body의 referenceDocumentId로만 보낸다.
 * 즉:
 * - 채팅 기록 저장: __general__
 * - 업로드 문서 참고: referenceDocumentId
 */
export async function sendChatMessage(
  documentId: string | undefined,
  question: string,
  currentPath?: string
): Promise<ChatResponse & Partial<ChatHistory>> {
  return apiClient<ChatResponse & Partial<ChatHistory>>(
    `/api/chat/${GENERAL_CHAT_ID}/exchange`,
    {
      method: "POST",
      body: JSON.stringify({
        question,
        currentPath,
        referenceDocumentId: documentId || "",
      }),
    }
  );
}

/**
 * 일반 챗봇 기록 삭제
 */
export async function deleteChatHistory(): Promise<void> {
  return apiClient<void>(`/api/chat/${GENERAL_CHAT_ID}`, {
    method: "DELETE",
  });
}