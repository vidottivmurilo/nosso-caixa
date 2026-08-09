import express from 'express';
import { authRoutes } from './routes/auth.routes.js';
import { groupRoutes } from './routes/groups.routes.js';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});