const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const corsOptions = require('./cors/corsOptions');
const dbClient = require('./db/db');

const app = express();

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: corsOptions,
});

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

dbClient.on('notification', (msg) => {
  try {
    if (msg.channel === 'friend_update') {
      const payload = JSON.parse(msg.payload);

      console.log(`Cambio detectado en la base de datos: ${JSON.stringify(payload)}`);

      io.emit('data_update', {
        action: payload.action,
        friends: JSON.parse(payload.friends),
      });
    }
  } catch (error) {
    console.error(`Error al procesar notificación de la base de datos: ${error.message}`);
  }
});

app.use((err, req, res, next) => {
  console.error(`Error en la solicitud: ${err.message}`);
  res.status(500).send('Algo salió mal.');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
}).on('error', (err) => {
  console.error(`Error al iniciar el servidor: ${err.message}`);
});
