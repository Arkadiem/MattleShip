# 🚢 MattleShip

Un juego de batalla naval online donde dos jugadores se enfrentan en tiempo real para hundir el barco enemigo en un tablero de 8x8.

## 🎮 Características

- **Juego online en tiempo real** con WebSocket
- **Tablero 8x8** con barco de tamaño 1x3
- **Sistema de login** con nickname único
- **Sistema de salas** (crear, unirse, eliminar)
- **Estadísticas de jugador** (victorias/derrotas)
- **Sistema de rangos** basado en victorias
- **Revancha** después de cada partida
- **Diseño responsivo** para todos los dispositivos

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18 o superior
- pnpm (instalar con `npm install -g pnpm`)
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuita)
- Cuenta en [Turso](https://turso.tech) (gratuita)

### Instalación

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

Editar `server/.env` con tus credenciales:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas (reemplazar con tus credenciales)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mattleship?retryWrites=true&w=majority

# Turso (reemplazar con tus credenciales)
TURSO_DATABASE_URL=libsql://<your-database>-<your-org>.turso.io
TURSO_AUTH_TOKEN=<your-auth-token>
```

4. **Iniciar el juego**
```bash
pnpm dev
```

5. **¡Listo!**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## 📁 Estructura del Proyecto

```
mattleShip/
├── client/              # Frontend Vue 3
│   ├── src/
│   │   ├── views/       # Vistas (Landing, Login, Lobby, Game, Profile)
│   │   ├── stores/      # Estado global (Pinia)
│   │   ├── services/    # Servicios (Socket.io)
│   │   └── router/      # Enrutamiento
│   └── package.json
├── server/              # Backend Node.js
│   ├── src/
│   │   ├── routes/      # API REST (autenticación)
│   │   ├── sockets/     # WebSocket (salas, juego)
│   │   ├── models/      # Modelos MongoDB
│   │   └── config/      # Configuración DB
│   └── package.json
└── package.json         # Monorepo config
```

## 🎯 Cómo Jugar

1. **Inicia el juego** desde la landing page
2. **Ingresa tu nickname** para identificarte
3. **Crea o únete a una sala** desde el lobby
4. **Espera a tu oponente** (o invita a un amigo)
5. **¡Ataca!** Selecciona casillas en el tablero enemigo
6. **Hunde el barco** enemigo para ganar
7. **¡Revancha!** Juega otra vez o vuelve al lobby

## 📊 Rangos

| Rango | Victorias Requeridas |
|-------|---------------------|
| 🌱 Recluta | 0 |
| 🔰 Marinero | 5 |
| 🏅 Teniente | 10 |
| 🎖️ Capitán | 20 |
| ⭐ Capitán de Flota | 50 |
| 👑 Almirante Legendario | 100 |

## ⚙️ Comandos

```bash
# Desarrollo (frontend + backend)
pnpm dev

# Solo frontend
pnpm dev:client

# Solo backend
pnpm dev:server

# Build para producción
pnpm build

# Iniciar en producción
pnpm start
```

## 🔧 Tecnologías

**Frontend:**
- Vue 3 (Composition API)
- Vite
- Pinia
- Vue Router
- Socket.io-client
- Axios

**Backend:**
- Node.js
- Express
- Socket.io
- MongoDB Atlas (Mongoose)
- Turso (SQLite)

## 📝 Reglas del Juego

- Tablero de **8x8 casillas**
- Cada jugador tiene **1 barco de tamaño 1x3**
- El barco se coloca **aleatoriamente** al inicio
- Los jugadores se **turnan para atacar**
- **Impacto:** 💥 (barco alcanzado)
- **Agua:** 🌊 (sin barco)
- **Gana** quien hunda el barco enemigo primero

## 🚫 Desconexión

Si un jugador se desconecta durante una partida:
- El otro jugador **gana automáticamente**
- Se actualizan las **estadísticas**
- La sala se **cierra automáticamente**

## 📄 Licencia

MIT

---

**¡Diviértete jugando MattleShip!** 🚢💥
