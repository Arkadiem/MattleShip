## Config
- Siempre usa pnpm
- Intenta usar la menor cantidad de dependencias posibles
- Al finalizar siempre actualiza la documentacion

## Coding style
- No hagas cambios grandes sin confirmar primero.
- Prioriza soluciones simples y compatibles con el código existente.
- Respeta la estructura actual del proyecto.
- Cuando propongas comandos, usa bloques de código listos para copiar.

## Output
- Sé breve y práctico.
- Indica qué archivos tocarás antes de modificarlos.
- Si hay dudas, pregunta antes de asumir.

---

# MattleShip - Documentación del Proyecto

## Descripción
MattleShip es un juego de batalla naval online donde dos jugadores se enfrentan en tiempo real para hundir el barco enemigo en un tablero de 8x8.

## Características
- 🎮 Juego online en tiempo real con WebSocket
- 🚢 Tablero 8x8 con barco de tamaño 1x3
- 👤 Sistema de login con nickname único
- 🏠 Sistema de salas (crear, unirse, eliminar)
- 📊 Estadísticas de jugador (victorias/derrotas)
- 🏆 Sistema de rangos
- 🔄 Revancha después de cada partida
- 📱 Diseño responsivo

## Arquitectura

### Frontend (Vue 3 + Vite)
```
client/
├── src/
│   ├── views/          # Vistas principales
│   │   ├── Landing.vue     # Página de inicio
│   │   ├── Login.vue       # Login de usuario
│   │   ├── Lobby.vue       # Lista de salas
│   │   ├── Game.vue        # Juego principal
│   │   └── Profile.vue     # Estadísticas
│   ├── components/     # Componentes reutilizables
│   ├── stores/         # Pinia stores
│   │   ├── user.js         # Estado del usuario
│   │   └── game.js         # Estado del juego
│   ├── services/       # Servicios
│   │   └── socket.js       # Cliente WebSocket
│   └── router/         # Vue Router
└── package.json
```

### Backend (Node.js + Express + Socket.io)
```
server/
├── src/
│   ├── routes/         # API REST
│   │   └── auth.js       # Autenticación y estadísticas
│   ├── sockets/        # WebSocket handlers
│   │   ├── index.js      # Configuración principal
│   │   ├── roomHandlers.js  # Gestión de salas
│   │   └── gameHandlers.js  # Lógica del juego
│   ├── models/         # Modelos MongoDB
│   │   └── Room.js       # Modelo de sala
│   └── config/         # Configuración
│       ├── mongodb.js    # Conexión MongoDB
│       └── turso.js      # Conexión Turso/SQLite
└── package.json
```

## Bases de Datos

### Turso (SQLite) - Usuarios
- Tabla `users`: id, nickname, wins, losses, created_at
- Almacena información de jugadores y estadísticas

### MongoDB Atlas - Juego
- Colección `rooms`: roomId, roomName, hostId, hostName, status, players, winner
- Persistencia de salas y estado del juego

## Instalación

### Prerrequisitos
- Node.js 18+
- pnpm
- MongoDB Atlas (cuenta gratuita)
- Turso (cuenta gratuita)

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd mattleShip
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**

Editar `server/.env`:
```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mattleship

# Turso
TURSO_DATABASE_URL=libsql://<your-database>-<your-org>.turso.io
TURSO_AUTH_TOKEN=<your-auth-token>
```

4. **Iniciar en modo desarrollo**
```bash
pnpm dev
```

5. **Acceder al juego**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Flujo del Juego

1. **Landing Page**: Descripción del juego y botón "Iniciar Juego"
2. **Login**: Ingresar nickname único
3. **Lobby**: Ver salas disponibles, crear o unirse a una sala
4. **Juego**: 
   - Esperar segundo jugador
   - Barco colocado automáticamente (1x3 aleatorio)
   - Por turnos, atacar casilla enemiga
   - Marcar hits (💥) y misses (🌊)
   - Hundir barco enemigo para ganar
5. **Fin del juego**: Opciones de revancha o volver al lobby

## Reglas del Juego

- Tablero de 8x8 casillas
- Cada jugador tiene 1 barco de tamaño 1x3
- El barco se coloca aleatoriamente al inicio
- Los jugadores se turnan para atacar
- Impacto: 💥 (barco alcanzado)
- Agua: 🌊 (sin barco)
- Gana quien hunda el barco enemigo primero

## Desconexión

Si un jugador se desconecta durante una partida:
- El otro jugador gana automáticamente
- Se actualizan las estadísticas
- La sala se cierra automáticamente

## Tecnologías

### Frontend
- Vue 3 (Composition API)
- Vite
- Pinia (state management)
- Vue Router
- Socket.io-client
- Axios

### Backend
- Node.js
- Express
- Socket.io
- Mongoose (MongoDB)
- @libsql/client (Turso)

## Comandos Disponibles

```bash
# Desarrollo (ambos frontend y backend)
pnpm dev

# Solo frontend
pnpm dev:client

# Solo backend
pnpm dev:server

# Build para producción
pnpm build

# Iniciar servidor en producción
pnpm start
```

## Licencia
MIT
