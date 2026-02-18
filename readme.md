# Phaser's Revenge

Phaser's Revenge is an adaptation of the classic game Space Invaders.

Your mission is to shoot the enemy ship and dodge its attacks to score as many points as possible in a short amount of time.

## Instructions

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. If you want to build the project, run `npm run build`.

## Sistema de Login y Sesiones

Se ha agregado un nuevo sistema de **Login y Gestión de Sesiones** que guarda la información de los jugadores localmente.

### Características

- **Crear Nueva Sesión**: Permite crear un perfil de jugador con:
  - Nombre de usuario personalizado
  - Selección de personaje (Personaje 1, 2, 3 o 4)
  - Selección de dificultad (Fácil, Medio, Difícil)

- **Cargar Sesiones Existentes**: Ver todas las sesiones guardadas y seleccionar cuál jugar

- **Información Guardada por Sesión**:
  - ID único de la sesión
  - Nombre de usuario
  - Personaje seleccionado
  - Nivel de dificultad
  - Fecha de creación
  - Última vez que se jugó
  - Progreso (level, score, coins, enemies_defeated)

### Cómo Funciona

1. **Al iniciar el juego**, aparece la pantalla de Login
2. **Si tienes sesiones guardadas**, puedes:
   - Hacer clic en una sesión para cargarla
   - O crear una nueva sesión
3. **Si no tienes sesiones**, se abre el formulario de creación de nueva sesión
4. **Después de crear o cargar una sesión**, el juego continúa normalmente

### API del SessionManager

El sistema proporciona un objeto global `SessionManager` con estos métodos:

```javascript
// Obtener todas las sesiones
SessionManager.getAllSessions()

// Crear una nueva sesión
SessionManager.createSession(username, character, difficulty)

// Cargar una sesión existente
SessionManager.loadSession(sessionId)

// Obtener la sesión actual
SessionManager.getCurrentSession()

// Eliminar una sesión
SessionManager.deleteSession(sessionId)

// Actualizar progreso de la sesión actual
SessionManager.updateSessionProgress(progressData)
```

### Almacenamiento

Todas las sesiones se guardan en `localStorage` bajo la clave `'gameSessions'`. Los datos persistirán entre sesiones del navegador.

![screenshot](screenshot.png)