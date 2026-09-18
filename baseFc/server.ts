import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import bodyParser from 'body-parser';
import { createServer as createViteServer } from 'vite';

import { errorHandler } from './src/backend/middlewares/error.middleware.ts';
import studentRoutes from './src/backend/routes/student.routes.ts';
import teacherRoutes from './src/backend/routes/teacher.routes.ts';
import classRoutes from './src/backend/routes/class.routes.ts';
import attendanceRoutes from './src/backend/routes/attendance.routes.ts';
import paymentRoutes from './src/backend/routes/payment.routes.ts';
import dashboardRoutes from './src/backend/routes/dashboard.routes.ts';
import auditRoutes from './src/backend/routes/audit.routes.ts';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Habilitar trust proxy para ambientes atrás de proxy reverso (Render, Cloudflare, Vercel)
  app.set('trust proxy', 1);

  // Segurança (Tríade CID)
  app.use(helmet({
    contentSecurityPolicy: false // Necessário no ambiente de dev do Vite e SPA
  }));

  // CORS: Suporte para chamada local ou via Vercel
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : true;

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'school-id']
  }));
  app.use(bodyParser.json());

  // Rate Limiting para prevenir DDoS/Brute Force (Disponibilidade)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // limite de 500 requisições por IP por janela de 15 minutos
    skip: (req) => req.method === 'OPTIONS', // não limitar preflights de CORS
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' }
  });
  app.use('/api', limiter);

  // Rotas da API
  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Base FC API', timestamp: new Date() }));
  app.use('/api/students', studentRoutes);
  app.use('/api/teachers', teacherRoutes);
  app.use('/api/classes', classRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/audit-logs', auditRoutes);

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
    const indexPath = path.join(distPath, 'index.html');
    const fs = await import('fs');

    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(indexPath);
      });
    } else {
      app.get('/', (req, res) => {
        res.json({
          service: 'Base FC API',
          status: 'online',
          health: '/api/health',
          timestamp: new Date()
        });
      });
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
