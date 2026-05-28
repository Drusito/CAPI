import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS para permitir conexiones desde clientes locales y alojados
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

app.use(express.json());

// Endpoint de prueba / healthcheck para Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Capitalista Server is running' });
});

app.get('/', (req, res) => {
  res.send('<h1>Capitalista MVP Socket.IO Server</h1>');
});

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
