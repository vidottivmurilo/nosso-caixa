import { Router } from 'express';
import { GroupController } from '../controllers/groupController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export const groupRoutes = Router();


groupRoutes.use(authMiddleware);

groupRoutes.post('/', GroupController.createGroup);

groupRoutes.get('/', GroupController.listGroups);

groupRoutes.post('/:groupId/invite', GroupController.inviteToGroup);

groupRoutes.get('/invites', GroupController.listInvites);

groupRoutes.post('/:groupId/accept', GroupController.acceptInvite);

groupRoutes.post('/:groupId/decline', GroupController.declineInvite);