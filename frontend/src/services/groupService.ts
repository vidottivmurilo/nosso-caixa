import { api } from './api';
import { type Group } from './dashboardService';

export async function createGroup(name: string): Promise<Group> {
  const response = await api.post<Group>('/groups', { name });
  return response.data;
}
export interface GroupInvite {
  id: string;
  group_id: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  created_at: string;
}

export interface PendingInviteResponse {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  group: {
    id: string;
    name: string;
  };
}

/**
 * Busca todos os convites pendentes para o e-mail do usuário logado.
 * Endpoint: GET /groups/invites
 */
export async function fetchPendingInvites(): Promise<PendingInviteResponse[]> {
  const response = await api.get<PendingInviteResponse[]>('/groups/invites');
  return response.data;
}

/**
 * Aceita um convite de grupo.
 * Endpoint: POST /groups/:groupId/accept
 */
export async function acceptInvite(groupId: string): Promise<void> {
  await api.post(`/groups/${groupId}/accept`);
}

/**
 * Recusa um convite de grupo.
 * Endpoint: POST /groups/:groupId/decline
 */
export async function declineInvite(groupId: string): Promise<void> {
  await api.post(`/groups/${groupId}/decline`);
}

/**
 * Envia um convite do grupo ativo para um e-mail.
 * Endpoint: POST /groups/:groupId/invite
 */
export async function sendInvite(groupId: string, email: string): Promise<void> {
  await api.post(`/groups/${groupId}/invite`, { email });
}
