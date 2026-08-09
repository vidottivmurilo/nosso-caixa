import { api } from './api';
import { Category } from './transactionService';

export interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  day_of_month: number;
  type: 'INCOME' | 'EXPENSE';
  created_at: string;
  category: Category | null;
}

/**
 * Busca todas as despesas fixas do grupo.
 * Endpoint: GET /fixed-expenses/group/:groupId
 */
export async function fetchFixedExpenses(groupId: string): Promise<FixedExpense[]> {
  const response = await api.get<FixedExpense[]>(`/fixed-expenses/group/${groupId}`);
  return response.data;
}

/**
 * Cadastra uma nova despesa/receita fixa.
 * Endpoint: POST /fixed-expenses
 */
export async function createFixedExpense(data: {
  group_id: string;
  category_id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  day_of_month: number;
}): Promise<void> {
  await api.post('/fixed-expenses', data);
}

/**
 * Gera as despesas do mês corrente baseado nas contas fixas cadastradas.
 * Endpoint: POST /fixed-expenses/group/:groupId/generate-month
 */
export async function generateMonthExpenses(groupId: string, month: number, year: number): Promise<void> {
  await api.post(`/fixed-expenses/group/${groupId}/generate-month`, {
    month,
    year
  });
}

/**
 * Exclui uma despesa fixa.
 * Endpoint: DELETE /fixed-expenses/:id
 */
export async function deleteFixedExpense(expenseId: string): Promise<void> {
  await api.delete(`/fixed-expenses/${expenseId}`);
}
