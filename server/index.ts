import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { setupSocketHandlers } from './socket';

const app = express();
const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, '..', 'dist');
const IS_PROD = fs.existsSync(DIST_DIR);

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// Servir archivos estáticos del build de Expo si existen
if (IS_PROD) {
  app.use(express.static(DIST_DIR));
}

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// En producción, todas las rutas no-API van al index.html (SPA)
if (IS_PROD) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('<h1>Capitalista Dev Server</h1><p>Ejecuta <code>npm start</code> para levantar la app web en localhost:3000</p>');
  });
}

const httpServer = createServer(app);

// Configurar Socket.IO con CORS amplio para desarrollo rápido
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Registrar los handlers de sockets
setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Servidor de Capitalista escuchando en el puerto ${PORT}`);
});
