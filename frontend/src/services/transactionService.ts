import { api } from './api';

// --- Tipagens ---

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  created_at: string;
  category: Category | null;
}

// --- Funções de Rede ---

/**
 * Busca todas as transações de um grupo para um determinado mês/ano.
 * Endpoint: GET /transactions/group/:groupId?month=X&year=Y
 */
export async function fetchTransactions(
  groupId: string,
  month: number,
  year: number
): Promise<Transaction[]> {
  const response = await api.get<Transaction[]>(`/transactions/group/${groupId}`, {
    params: { month, year },
  });
  return response.data;
}

/**
 * Exclui uma transação pelo ID.
 * Endpoint: DELETE /transactions/:id
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  await api.delete(`/transactions/${transactionId}`);
}

/**
 * Cria uma transação simples.
 * Endpoint: POST /transactions
 */
export async function createTransaction(data: {
  group_id: string;
  category_id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
}): Promise<void> {
  await api.post('/transactions', data);
}

/**
 * Cria um parcelamento (múltiplas transações).
 * Endpoint: POST /installments
 */
export async function createInstallment(data: {
  group_id: string;
  category_id: string;
  total_amount: number;
  installments_count: number;
  start_date: string;
  description: string;
}): Promise<void> {
  await api.post('/installments', data);
}

/**
 * Busca todas as categorias disponíveis.
 * Endpoint: GET /categories
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/categories');
  return response.data;
}
