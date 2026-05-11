# Furía del Abismo - Documentación Técnica

Un juego 2D multijugador competitivo/cooperativo basado en **Phaser 3** con un sistema robusto de sesiones de usuario y múltiples modos de juego.

---

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Sistema de Sesiones](#sistema-de-sesiones)
3. [Flujo del Juego](#flujo-del-juego)
4. [Mecánicas de Gameplay](#mecánicas-de-gameplay)
5. [Clases Principales](#clases-principales)
6. [Física y Colisiones](#física-y-colisiones)
7. [Entrada de Usuario](#entrada-de-usuario)
8. [Sistema de Habilidades Especiales](#sistema-de-habilidades-especiales)

---

## Arquitectura General

### El Framework: Phaser 3

El juego está construido con **Phaser 3**, una librería JavaScript para videojuegos 2D que proporciona:

- **Motor de Física**: Arcade physics (gravedad, colisiones, overlaps)
- **Sistema de Sprites**: Carga, escalado y animación de imágenes
- **Entrada**: Manejo de teclado, ratón, joystick/gamepad
- **Audio**: Reproducción de música y efectos de sonido
- **Tweens**: Animaciones suaves (movimiento, escala, rotación)

**Archivo principal**: `src/main.js`
- Configura el tamaño del viewport (1024x768)
- Define la física (gravedad y debug)
- Registra todas las escenas en orden

---

## Sistema de Sesiones

### Concepto

El juego requiere **inicio de sesión con Google** para perseguir el progreso del jugador. Cada jugador tiene:

- **ID de sesión**: Identificador único (ej: "juan_1715000000000")
- **Perfil**: Nombre, personaje seleccionado, dificultad
- **Progreso**: Nivel, puntos, monedas, enemigos derrotados
- **Estadísticas**: Tiempo de juego total, fecha de creación

### Implementación (`SessionManager` en `game.js`)

```javascript
SessionManager = {
    getAllSessions()        // Obtiene todas las sesiones del localStorage
    createSession()         // Crea nueva sesión (nombre, personaje, dificultad)
    loadSession(id)        // Carga una sesión existente
    getCurrentSession()    // Obtiene la sesión activa
    updateSessionProgress() // Actualiza score, level, coins, etc.
    endSession()           // Finaliza y guarda tiempo de juego
    getCurrentSessionPlayTime() // Retorna minutos jugados
}
```

**Almacenamiento**: `localStorage` bajo la clave `"gameSessions"` (JSON)

**Autenticación**: Google Sign-In (OAuth2) - requiere configurar `VITE_GOOGLE_CLIENT_ID`

---

## Flujo del Juego

### Orden de Escenas

```
1. LoginScene
    ↓ (usuario inicia sesión o carga sesión)
2. Preloader (carga assets)
    ↓
3. Menu (menú principal)
    ↓
4. CharacterSelector (elige personaje)
    ↓
5. MapSelector (elige mapa)
    ↓
6. GameScene (gameplay)
    ↓
7. GameOverScene (fin del juego)
    ↓ (reinicia en Menu o vuelve a Login)
```

### LoginScene

- Muestra sesiones guardadas
- Permite crear nueva sesión via Google Sign-In
- Si hay sesiones, puedes seleccionar cuál cargar
- Soporta navegación con gamepad (D-Pad, analog stick)

### Menu + ControlsScene

- Menú principal con opciones
- ControlsScene explica los controles del juego

### CharacterSelector & MapSelector

- Permite elegir qué personaje (pj1, pj2, pj3, pj4)
- Permite elegir mapa disponible

### GameScene (Principal)

- Los dos jugadores aparecen en pantalla
- Sistema de turnos/simultáneo según modo
- Manejo de input, colisiones, daño
- Actualización de barras de vida y energía
- Detección de game over

### HudScene (Overlay)

- Sobrepuesto en GameScene
- Muestra puntos y tiempo restante en tiempo real

---

## Mecánicas de Gameplay

### Modos de Juego

#### 1. **Versus** (Competitivo)
- Dos jugadores luchan entre sí
- Cada uno tiene su propia vida (1000 HP) y energía (500)
- Gana quien reduzca la vida del otro a 0
- Pueden haber habilidades especiales

#### 2. **Cooperativo** (Co-op)
- Un solo sprite compartido entre ambos jugadores
- Vida principal (1000) + vida secundaria (500)
- Mismo pool de energía compartido (500)
- Un reticle orbita el personaje para indicar dirección
- Ambos usan el mismo sprite pero son jugadores separados en input

### Vida y Energía

**Vida (Health)**
- Cada jugador comienza con 1000 HP
- En coop: vida secundaria de 500 adicionales
- Cuando llega a 0, el jugador es derrotado

**Energía (Energy)**
- Comienza con 500
- Gastar energía al disparar proyectiles
- Recuperarse automáticamente con el tiempo
- En coop, es un pool compartido

### Estados del Jugador

Cada jugador tiene varios estados activos simultáneamente:

- `state`: "waiting", "start", "can_move"
- `blocking`: si está bloqueando (reduce daño)
- `immobilized`: no puede moverse (tras ser golpeado fuerte)
- `chargingShot`: acumulando carga de disparo
- `beingHit`: stun temporal tras daño

### Daño por Bloqueo

- Si un jugador bloquea demasiado, recibe daño pasivo
- `blockingDamagePerSecond` aplica daño constante
- Sistema para incentivar movimiento activo

---

## Clases Principales

### 1. **Player** (`src/gameobjects/Player.js`)

Representa el jugador controlable.

**Propiedades:**
- `state`: "waiting" → "start" → "can_move"
- `bullets`: pool de 100 proyectiles máximo
- `scene`: referencia a la escena

**Métodos principales:**
```javascript
start()           // Anima entrada (tween de izq a der)
move(direction)   // Mueve arriba/abajo (solo si state === "can_move")
fire(x, y)        // Dispara proyectil hacia (x, y)
update()          // Movimiento sinusoidal suave (oscilación)
```

**Comportamiento:**
- Aparece fuera de pantalla (-190, 100)
- Tween anima entrada hacia (200, 100) en 800ms
- Una vez en posición, puede moverse arriba/abajo 5px por frame
- Tiene límites de pantalla (no sale del viewport)
- Update() añade oscilación sinusoidal suave (más realista)

### 2. **BlueEnemy** (`src/gameobjects/BlueEnemy.js`)

Representa el enemigo que el jugador enfrenta.

**Propiedades:**
- `damage_life_point`: 3 impactos para derrotar
- `scale_damage`: escala del sprite (4 inicial, disminuye al recibir daño)
- `up_down_tween`: movimiento arriba/abajo continuo
- `animation_is_playing`: bandera para evitar animaciones simultáneas
- `bullets`: pool de proyectiles

**Métodos principales:**
```javascript
start()                    // Anima entrada (derecha a izq)
damage(player_x, player_y) // Recibe daño, escala, contraataca
```

**Comportamiento:**
- Aparece fuera pantalla (width+150, height-100)
- Tween anima entrada hacia (width-150, height-100)
- Se mueve arriba/abajo en bucle (yoyo: true, repeat: -1)
- Cuando recibe daño: escala disminuye, velocidad de movimiento aumenta
- Después de 3 impactos, desaparece (scale === 1)

### 3. **Bullet** (`src/gameobjects/Bullet.js`)

Proyectil que disparan tanto jugadores como enemigos.

**Propiedades:**
- `speed`: velocidad de 450px/s
- `end_direction`: vector normalizado (dirección)
- `flame`: partículas al destruirse

**Métodos:**
```javascript
fire(x, y, targetX, targetY, texture) // Activa bala y calcula dirección
destroyBullet()                       // Crea efecto de llama y elimina
update(time, delta)                   // Mueve la bala, detecta fuera de pantalla
```

**Efecto visual:**
- Bloom (brillo) blanco
- Partículas de fuego al impactar
- Desaparece si sale del viewport

---

## Física y Colisiones

### Plataformas

Las plataformas son **rectángulos invisibles** que actúan como suelo estático.

**En GameScene:**
```javascript
createMapPlatforms(mapName)   // Define dónde van las plataformas
buildPlatformsFromData()      // Crea los rectángulos físicos
```

**Para Mapa 1:**
- Suelo izquierdo (bajo)
- Suelo derecho (más bajo, crea inclinación)
- Plataformas medias cerca de cada jugador
- Plataforma central compartida
- Plataformas pequeñas para estrategia

**Código relevante:**
```javascript
const rect = this.add.rectangle(x, y, w, h, 0x000000, 0)
             .setOrigin(0.5);
this.physics.add.existing(rect, true);
this.groundGroup.add(rect);
```

### Colisiones

**Colliders (físicos):**
- Jugador 1 sprite + groundGroup
- Jugador 2 sprite + groundGroup (excepto en coop)
- Ambos jugadores se afectan mutuamente

**Overlaps (detectan colisión sin física):**
- Proyectiles + Jugador 1 → `handleProjectilePlayerOverlap()`
- Proyectiles + Jugador 2 → `handleProjectilePlayerOverlap()`

**Función de overlap:**
```javascript
handleProjectilePlayerOverlap(projectile, player, playerIndex) {
    // Detecta cuál es la bala
    if (projectile.shooter === playerIndex) return; // friendly fire
    applyDamageToPlayer(playerIndex, projectile.damage);
    if (!projectile.piercing) projectile.destroy();
}
```

---

## Entrada de Usuario

### Teclado

**Jugador 1:**
- W: Arriba
- A: Izquierda
- D: Derecha
- S: Abajo
- X: Golpe (hit)
- C: Bloquear
- V: Cargar disparo
- B: Disparar

**Jugador 2:**
- UP: Arriba
- LEFT: Izquierda
- RIGHT: Derecha
- DOWN: Abajo
- K: Golpe
- L: Bloquear
- O: Cargar
- P: Disparar

### Gamepad (Xbox/PlayStation)

- **D-Pad** o **Analog Stick**: Movimiento
- **A (Xbox) / Equis (PS)**: Saltar/Acción
- **B / Círculo**: Disparar
- **X / Cuadrado**: Golpe
- **Y / Triángulo**: Bloquear
- **Triggers**: Cargar disparo

**Código:**
```javascript
this.keysP1 = this.input.keyboard.addKeys({
    up: "W", left: "A", right: "D", down: "S",
    hit: "X", block: "C", charge: "V", shoot: "B"
});
```

### Manejo en `updatePlayerInput()`

```javascript
updatePlayerInput(playerIndex, time) {
    const p = this.players[playerIndex];
    const keys = playerIndex === 0 ? this.keysP1 : this.keysP2;
    
    // Si presiona tecla de movimiento, ejecuta move()
    if (keys.up.isDown) p.sprite.move('up');
    if (keys.down.isDown) p.sprite.move('down');
    
    // Si presiona disparo y pasó cooldown, dispara
    if (keys.shoot.isDown && time > p.lastShot + p.shotCD) {
        p.sprite.fire(...);
        p.lastShot = time;
    }
    
    // Lógica similar para bloquear, golpear, cargar
}
```

---

## Sistema de Habilidades Especiales

### Buffering de Habilidades

Cada jugador tiene buffers para secuencias de botones:

```javascript
specialBuffer: []              // Secuencia: L, L, X
transformBuffer: []            // Secuencia: X, X, Y
explosionBuffer: []            // Secuencia: X, B, B, L
// ... etc para cada habilidad
```

### Habilidades por Personaje

**Ejemplos** (en GameScene.js):

1. **Sofia - Laser** (L, L, X)
   - Secuencia: presiona L dos veces, luego X
   - Efecto: dispara rayo laser
   - Costo: energía

2. **Sofia - Teletransporte** (L, B, B)
   - Teletransporta a posición aleatoria
   - Evita ataques

3. **Franchesca - Robo de Energía** (L, L, L)
   - Roba energía del enemigo
   - La usa para sí misma

4. **Franchesca - Salto Especial** (X, X, B)
   - Salto potenciado con daño
   - Inmunidad temporal

### Cómo Funciona

1. Cada frame, revisa si el jugador presionó un botón
2. Lo añade al buffer: `specialBuffer.push('X')`
3. Limita buffer a últimos 6 inputs
4. Compara con patrones:
   ```javascript
   if (lastN(specialBuffer, 3) === ['L', 'L', 'X']) {
       // Activar habilidad
       p.specialActive = true;
       p.specialTimer = time + 2000; // duración 2s
   }
   ```
5. Mientras está activa, aplica efectos (daño, velocidad, etc)
6. Cuando timer expira, desactiva

---

## Barras de Vida y Energía

### Renderizado

```javascript
// Barra de vida (roja)
const hpBar = this.add.rectangle(150, 30, 400, 18, 0xff0000)
    .setOrigin(0, 0.5);

// Barra de energía (azul)
const enBar = this.add.rectangle(150, 58, 400, 12, 0x00ccff)
    .setOrigin(0, 0.5);
```

### Actualización cada frame

```javascript
update(time) {
    const maxHP = 1000;
    const maxEN = 500;
    
    const hpPercent = Math.max(0, p.health / maxHP);
    const enPercent = Math.max(0, p.energy / maxEN);
    
    hpBar.width = 400 * hpPercent;
    enBar.width = 400 * enPercent;
}
```

### Modo Cooperativo

- Barra derecha oculta
- Se añade barra pequeña naranja bajo la principal (vida secundaria)

---

## Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir navegador
# http://localhost:5173 (o el puerto que indique Vite)

# 4. Compilar para producción
npm run build
```

---

## Estructura de Archivos Clave

```
furiadelabismo/
├── src/
│   ├── main.js              # Configuración y arranque de Phaser
│   ├── gameobjects/
│   │   ├── Player.js        # Clase del jugador
│   │   ├── BlueEnemy.js     # Clase del enemigo
│   │   └── Bullet.js        # Clase de proyectiles
│   ├── scenes/
│   │   ├── GameScene.js     # Escena principal (gameplay)
│   │   ├── HudScene.js      # Overlay con puntos y tiempo
│   │   ├── GameOverScene.js # Pantalla de fin
│   │   ├── MainScene.js     # Menú principal
│   │   ├── SplashScene.js   # Pantalla de inicio
│   │   ├── ControlsScene.js # Tutorial de controles
│   │   └── ... otras escenas
│   ├── core/
│   │   └── common.js        # Funciones compartidas
│   └── services/
│       └── translations.js  # Soporte multi-idioma
├── public/
│   ├── assets/              # Sprites, enemigos, fuentes
│   └── mapas/               # Datos de mapas (JSON)
├── game.js                  # Definición de escenas + SessionManager
├── index.html               # HTML principal + Google Sign-In
├── vite.config.js          # Configuración de Vite
├── package.json            # Dependencias
└── readme.md               # Este archivo
```

---

## Tecnologías Utilizadas

- **Phaser 3.x**: Engine de juegos
- **Vite**: Build tool y dev server
- **JavaScript ES6+**: Lenguaje
- **Google Sign-In**: Autenticación
- **localStorage**: Persistencia de sesiones
- **CSS3**: Estilos

---

## Configuración Ambiental

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

### En Vercel (Producción)

Configura estas variables en Settings → Environment Variables:

```
VITE_GOOGLE_CLIENT_ID = [tu_google_client_id]
```

---

## Conclusión

Este es un juego complejo con múltiples sistemas interconectados. Los componentes principales son:

1. **Phaser** gestiona el rendering y física
2. **SessionManager** persigue el progreso del jugador
3. **GameScene** orquesta todo el gameplay
4. **Player** y **BlueEnemy** son los actores principales
5. **Bullet** maneja proyectiles y colisiones
6. **Habilidades especiales** añaden profundidad estratégica

Cada parte está modularizada para facilitar cambios y expansiones futuras.