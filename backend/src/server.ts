import express from 'express';
import { authRoutes } from './routes/auth.routes.js';
import { groupRoutes } from './routes/groups.routes.js';
import { transactionRoutes } from './routes/transactions.routes.js';
import { installmentRoutes } from './routes/installments.routes.js';
import { fixedExpenseRoutes } from './routes/fixedExpenses.routes.js';
import { aiRoutes } from './routes/ai.routes.js';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/transactions', transactionRoutes);
app.use('/installments', installmentRoutes);
app.use('/fixed-expenses', fixedExpenseRoutes);
app.use('/ai', aiRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});