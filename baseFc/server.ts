import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import bodyParser from 'body-parser';
import { createServer as createViteServer } from 'vite';

import { errorHandler } from './src/backend/middlewares/error.middleware.ts';
import studentRoutes from './src/backend/routes/student.routes.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Segurança (CID)
  app.use(helmet({
    contentSecurityPolicy: false // Necessário no ambiente de dev do Vite
  }));
  app.use(cors());
  app.use(bodyParser.json());

  // Rate Limiting para prevenir DDoS/Brute Force (Disponibilidade)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' }
  });
  app.use('/api', limiter);

  // Rotas da API
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/students', studentRoutes);

  // Middleware Global de Tratamento de Erros
  app.use(errorHandler);

  // Integração com Vite (Frontend)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Em express v5 é *all, mas o package.json tem express 5.x. Vamos usar *all ou uma rota customizada.
    // O usuário instalou express 5.2.1, então a sintaxe é '*' ou '/(.*)'?
    // "Note the Express version of the app. In Express v4, use app.get('*', ...), but in Express v5, you must use app.get('*all', ...)"
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
