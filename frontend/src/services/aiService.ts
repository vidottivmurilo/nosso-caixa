import { api } from './api';

export interface AiParseResponse {
  message: string;
  installment?: any; // Se foi parcelamento
  created_transactions?: number;
  ai_raw_data: {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    is_installment: boolean;
    installments_count?: number | null;
    date: string;
  };
}

/**
 * Envia um texto para a Inteligência Artificial analisar e criar a transação.
 * Endpoint: POST /ai/parse-transaction
 */
export async function parseTransactionWithAi(text: string, groupId: string): Promise<AiParseResponse> {
  const response = await api.post<AiParseResponse>('/ai/parse-transaction', {
    text,
    group_id: groupId,
  });
  return response.data;
}
