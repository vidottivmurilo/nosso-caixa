import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { authRoutes } from './routes/auth.routes.js';
import { groupRoutes } from './routes/groups.routes.js';
import { transactionRoutes } from './routes/transactions.routes.js';
import { installmentRoutes } from './routes/installments.routes.js';
import { fixedExpenseRoutes } from './routes/fixedExpenses.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { savingsRoutes } from './routes/savings.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Documentação Swagger
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs', 'swagger.json'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/transactions', transactionRoutes);
app.use('/installments', installmentRoutes);
app.use('/fixed-expenses', fixedExpenseRoutes);
app.use('/ai', aiRoutes);
app.use('/savings', savingsRoutes);
app.use('/dashboard', dashboardRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Documentação disponível em: http://localhost:${port}/api-docs`);
});