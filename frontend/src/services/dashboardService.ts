import { api } from './api';

// --- Tipagens ---

export interface Group {
  id: string;
  name: string;
  created_at: string;
  my_role: 'OWNER' | 'MEMBER';
}

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  savings_amount: number;
}

// --- Funções de Rede ---

/**
 * Busca todos os grupos do usuário logado.
 * Endpoint: GET /groups
 */
export async function fetchUserGroups(): Promise<Group[]> {
  const response = await api.get<Group[]>('/groups');
  return response.data;
}

/**
 * Busca o resumo financeiro (agregações) de um grupo em um determinado mês/ano.
 * Endpoint: GET /dashboard/group/:groupId/summary?month=X&year=Y
 */
export async function fetchDashboardSummary(
  groupId: string,
  month: number,
  year: number
): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>(
    `/dashboard/group/${groupId}/summary`,
    { params: { month, year } }
  );
  return response.data;
}

/**
 * Atualiza o valor da caixinha (Reserva de Emergência)
 * Endpoint: PUT /savings/group/:groupId
 */
export async function updateSavings(groupId: string, amount: number): Promise<void> {
  await api.put(`/savings/group/${groupId}`, { amount });
}
