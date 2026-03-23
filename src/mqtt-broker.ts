import { createServer } from 'net';
import { Aedes } from 'aedes';

const aedes = new Aedes();

const server = createServer(aedes.handle);

server.listen(1883, '127.0.0.1', () => {
  console.log('Mock MQTT broker running on 127.0.0.1:1883');
});

aedes.on('client', (client) => {
  console.log('Client connected:', client.id);
});

aedes.on('clientDisconnect', (client) => {
  console.log('Client disconnected:', client.id);
});

aedes.on('publish', (packet, client) => {
  if (client) {
    console.log('Message on', packet.topic, ':', packet.payload.toString());
  }
});

process.on('SIGINT', () => {
  server.close();
  aedes.close();
  process.exit(0);
});
