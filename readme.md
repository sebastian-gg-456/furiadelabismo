# Furía del Abismo - GUÍA SIMPLE DEL JUEGO

¡CUIDADO! Este es un juego donde TÚ controlas a un personaje que tiene que combatir enemigos. Aquí te explico **EXACTAMENTE** cómo hace todo, paso a paso, para que cuando tu profe te pregunte sepas responder.

---

## Tabla de Contenidos

1. [¿Cómo empiezo a jugar?](#cómo-empiezo-a-jugar)
2. [¿Cómo se mueve mi personaje?](#cómo-se-mueve-mi-personaje)
3. [¿Cómo disparo?](#cómo-disparo)
4. [¿Cómo elijo personaje?](#cómo-elijo-personaje)
5. [¿Cómo elijo el mapa?](#cómo-elijo-el-mapa)
6. [¿Cómo se guardan mis partidas?](#cómo-se-guardan-mis-partidas)
7. [¿Qué pasa en una batalla?](#qué-pasa-en-una-batalla)
8. [Modo Versus vs Cooperativo](#modo-versus-vs-cooperativo)

---

## ¿Cómo empiezo a jugar?

Cuando abres el juego, pasa esto:

### Paso 1: INICIAR SESIÓN
Primero, el juego te pide que **inicies sesión con Google** (es como cuando entras en YouTube con tu cuenta de Google). Esto es para que el juego SEPA quién eres y pueda guardar tu progreso.

- Si es tu **primera vez**, haces clic en "Iniciar sesión con Google"
- El juego crea una **cuenta nueva** con tu nombre
- Tu cuenta se guarda **automáticamente** en la computadora

### Paso 2: CARGAR SESIÓN
Si ya habías jugado antes:
- El juego te muestra todas tus cuentas guardadas
- Escoges cuál quieres jugar
- ¡Listo! Tu progreso se carga

**¿Dónde se guarda?** En `localStorage` = Un espacio secreto del navegador que guarda datos como si fuera una carpeta en tu PC.

---

## ¿Cómo se mueve mi personaje?

Tu personaje es como una nave que puede subir y bajar. Para que se mueva:

### CON TECLADO (PC):
- **Flecha ARRIBA** → Tu personaje sube hacia arriba ⬆️
- **Flecha ABAJO** → Tu personaje baja hacia abajo ⬇️

### ¿Cómo funciona técnicamente?

Este es el punto SUPER IMPORTANTE que tu profe probablemente pregunte.

#### Paso 1: EL LOOP PRINCIPAL (El corazón del juego)

Phaser tiene un **loop infinito** que corre **60 veces por segundo**. Es como un fotograma en una película:

```
┌─────────────────────────────────┐
│  FRAME 1: Tiempo 0ms            │
│  ├─ Detecta teclas presionadas  │ ← ¿Presionaste algo?
│  ├─ Actualiza posiciones        │ ← Mueve el personaje
│  ├─ Dibuja la pantalla          │ ← Redibuja TODO
│  └─ Tiempo total: ~16ms         │ (1000ms / 60 frames)
│                                 │
│  FRAME 2: Tiempo 16ms           │
│  ├─ Detecta teclas presionadas  │
│  ├─ Actualiza posiciones        │
│  ├─ Dibuja la pantalla          │
│  └─ Tiempo total: ~16ms         │
│                                 │
│  FRAME 3: Tiempo 32ms           │
│  ├─ Detecta teclas presionadas  │
│  └─ ... (se repite forever)     │
└─────────────────────────────────┘
```

#### Paso 2: DETECTAR LA TECLA

En `src/scenes/GameScene.js`, hay código que dice:

```javascript
// Crear teclas de cursor
this.cursors = this.input.keyboard.createCursorKeys();

// Si presionas la flecha ARRIBA, hacer esto:
// (esto se ejecuta CADA FRAME mientras la tecla esté presionada)
if (this.cursors.up.isDown) {
    this.player.move("up");
}

// Si presionas la flecha ABAJO, hacer esto:
if (this.cursors.down.isDown) {
    this.player.move("down");
}
```

**¿Qué significa `isDown`?**
Es como preguntar "¿La tecla está siendo presionada AHORA EN ESTE FRAME?" Si la respuesta es SÍ, ejecutamos el movimiento.

#### Paso 3: CAMBIAR LA POSICIÓN (El movimiento real)

En `src/gameobjects/Player.js`, el método `move()` hace esto:

```javascript
move(direction) {
    if(this.state === "can_move") {  // ← Verifica que el personaje PUEDA moverse
        if (direction === "up" && this.y - 10 > 0) {
            this.y -= 5;  // ← RESTA 5 a la posición Y
        } else if (direction === "down" && this.y + 75 < this.scene.scale.height) {
            this.y += 5;  // ← SUMA 5 a la posición Y
        }
    }
}
```

**¿Qué pasa aquí?**
1. `this.y` es el número que dice "¿A qué altura está el personaje?"
2. `this.y -= 5` significa: `this.y = this.y - 5` (resta 5)
3. `this.y += 5` significa: `this.y = this.y + 5` (suma 5)

**Ejemplo del mundo real:**
```
Inicialmente: personaje.y = 400

FRAME 1: Presionas ARRIBA
  → personaje.y -= 5
  → personaje.y = 400 - 5 = 395

FRAME 2: Presionas ARRIBA
  → personaje.y -= 5
  → personaje.y = 395 - 5 = 390

FRAME 3: Presionas ARRIBA
  → personaje.y -= 5
  → personaje.y = 390 - 5 = 385

RESULTADO: El personaje ha subido 15 píxeles en 3 frames
```

**¿Por qué `-5` para subir y `+5` para bajar?**

En las pantallas de computadora, el sistema de coordenadas es así:

```
Y = 0    ┌─────────────────────┐ ARRIBA
         │                     │
Y = 200  │    EL JUEGO        │
         │                     │
Y = 400  │   (400, 400)       │ AQUÍ está el personaje
         │                     │
Y = 768  └─────────────────────┘ ABAJO (borde de la pantalla)
```

- **Y pequeño** (0) = Arriba
- **Y grande** (768) = Abajo

Por eso restamos para subir (Y menor) y sumamos para bajar (Y mayor).

#### Paso 4: REDIBUJAR LA PANTALLA

Después de cambiar la posición, Phaser automáticamente **redibuja TODO**:

```javascript
// Phaser hace esto internamente cada frame
this.cameras.main.render();
```

Es como tienes una pizarra y en cada frame:
1. BORRAS TODO
2. Redibujas el fondo
3. Redibujas el personaje en su NUEVA posición
4. Redibujas los enemigos
5. Redibujas las balas

Como esto ocurre **60 veces por segundo**, tu ojo ve movimiento suave (como una película).

#### Resumen: El ciclo completo

```
60 veces por segundo:
┌─────────────────────────┐
│ DETECTAR TECLA PRESIONADA
│ ↓
│ CAMBIAR POSICIÓN (y = y ± 5)
│ ↓
│ REDIBUJAR PANTALLA
│ ↓
│ ESPERAR 16ms (1000 / 60)
└─────────────────────────┘
```

El Y es la posición vertical. Imagina que la pantalla es un plano cartesiano:
- Arriba = números MENORES
- Abajo = números MAYORES

---

## ¿Cómo disparo?

Tu personaje tiene que disparar balas para atacar a los enemigos.

### CON TECLADO:
- **ESPACIO** → Dispara una bala

### CON RATÓN:
- **Clic del ratón** → Dispara hacia donde hiciste clic

### ¿Cómo funciona técnicamente?

#### Paso 1: DETECTAR LA PULSACIÓN

En `src/scenes/GameScene.js`:

```javascript
// Detectar ESPACIO presionado
if (this.cursors.space.isDown) {
    this.player.fire();
}

// Detectar clic del ratón
this.input.on("pointerdown", (pointer) => {
    this.player.fire(pointer.x, pointer.y);
});
```

Cuando presionas ESPACIO o haces clic, se llama a `this.player.fire()`.

#### Paso 2: CREAR LA BALA

En `src/gameobjects/Player.js`, el método `fire()` hace esto:

```javascript
fire(x, y) {
    if(this.state === "can_move") {
        // Obtener una bala del POOL (lista de balas disponibles)
        const bullet = this.bullets.get();
        
        if (bullet) {
            // Disparar la bala desde la posición del personaje
            bullet.fire(
                this.x + 16,  // Posición X de donde sale la bala
                this.y + 5,   // Posición Y de donde sale la bala
                x,            // Coordenada X del destino (mouse)
                y             // Coordenada Y del destino (mouse)
            );
        }
    }
}
```

**¿Qué es el POOL de balas?**

Es un **grupo reutilizable** de balas:

```javascript
this.bullets = this.scene.physics.add.group({
    classType: Bullet,      // Tipo de objeto que guarda
    maxSize: 100,           // Máximo de balas (100)
    runChildUpdate: true    // Actualizar cada bala cada frame
});
```

En lugar de **crear una bala nueva cada disparo** (que es lento), el juego tiene 100 balas "dormidas" y las reactiva:

```
POOL DE BALAS:
┌──────────────────────────────────┐
│ [BALA1: inactiva] [BALA2: inactiva] │
│ [BALA3: inactiva] [BALA4: inactiva] │
│ ... (hasta 100 balas)            │
└──────────────────────────────────┘

Presionas ESPACIO:
  → Juego: "Dame una bala del pool"
  → Pool: "Toma BALA1, te la activo"
  ✓ BALA1 sale volando

Bala sale de pantalla:
  → BALA1 se desactiva
  → Vuelve al pool para reutilizarla
```

#### Paso 3: CALCULAR LA DIRECCIÓN

En `src/gameobjects/Bullet.js`, el método `fire()` hace esto:

```javascript
fire(x, y, targetX = 1, targetY = 0, bullet_texture = "bullet") {
    // Colocar bala en la posición del personaje
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    // Calcular HACIA DÓNDE va la bala
    if (targetX === 1 && targetY === 0) {
        // Si no hay destino, ir hacia la derecha
        this.end_direction.setTo(1, 0);
    } else {
        // Calcular el vector de dirección hacia el destino
        this.end_direction.setTo(targetX - x, targetY - y).normalize();
    }
}
```

**¿Qué es `normalize()`?**

Es una operación matemática que convierte cualquier vector en una dirección unitaria (magnitud = 1):

```
Ejemplo:
Personaje está en (200, 400)
Hiciste clic en (800, 300)

Diferencia: (800 - 200, 300 - 400) = (600, -100)

Sin normalize: La bala se movería 600 píxeles en X y -100 en Y cada frame
               (SUPER RÁPIDO e impredecible)

Con normalize: Se convierte a algo como (0.985, -0.164)
               (DIRECCIÓN PURA, sin distancia)

Luego la velocidad se aplica: 
  bala.x += 0.985 * 450 * delta
  bala.y += -0.164 * 450 * delta
```

#### Paso 4: ACTUALIZAR LA POSICIÓN CADA FRAME

En `src/gameobjects/Bullet.js`, el método `update()` se ejecuta **cada frame**:

```javascript
update(time, delta) {
    // Mover la bala usando la dirección calculada
    this.x += this.end_direction.x * this.speed * delta;
    this.y += this.end_direction.y * this.speed * delta;

    // Si la bala se salió de la pantalla, destruirla
    if (this.x > this.scene.sys.canvas.width || 
        this.x < 0 || 
        this.y > this.scene.sys.canvas.height || 
        this.y < 0) {
        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }
}
```

**Desglosemos esto:**

```
this.speed = Phaser.Math.GetSpeed(450, 1)
             ↓
             Significa: 450 píxeles por segundo

Cada frame (delta ≈ 0.016 segundos):
  bala.x += directionX * 450 * 0.016
  bala.x += directionX * 7.2 píxeles
  
Si directionX = 0.985:
  bala.x += 0.985 * 7.2 ≈ 7.09 píxeles cada frame

Resultado: La bala se mueve suavemente a 450 píxeles/segundo
```

#### Paso 5: DETECTAR COLISIÓN

En `src/scenes/GameScene.js`, hay un **colider** (detector de colisiones):

```javascript
this.physics.add.overlap(
    player.bullets,     // Grupo de balas del jugador
    enemy,              // El enemigo
    () => {
        // Si una bala toca al enemigo:
        enemyHealth -= 10;  // Enemigo recibe daño
        bullet.destroy();   // Bala desaparece
    }
);
```

**¿Cómo funciona `overlap()`?**

Phaser **verifica cada frame** si los dos objetos se tocan:

```
FRAME 1: BALA en (300, 400), ENEMIGO en (600, 400) → NO se tocan
FRAME 2: BALA en (310, 400), ENEMIGO en (600, 400) → NO se tocan
FRAME 3: BALA en (320, 400), ENEMIGO en (600, 400) → NO se tocan
...
FRAME 50: BALA en (600, 400), ENEMIGO en (600, 400) → ¡SE TOCAN!
          → Ejecutar función de daño
          → Destruir bala
```

### Resumen: El ciclo completo del disparo

```
1. PRESIONAR ESPACIO
   ↓
2. OBTENER BALA DEL POOL
   ↓
3. CALCULAR DIRECCIÓN (normalize)
   ↓
4. CADA FRAME: 
   - Actualizar posición X e Y
   - Verificar si salió de pantalla
   - Verificar si toca al enemigo
   ↓
5. SI TOCA AL ENEMIGO:
   - Restar vida
   - Destruir bala
   ↓
6. SI SALE DE PANTALLA:
   - Devolver bala al pool
```

---

## ¿Cómo funciona la FÍSICA del juego?

Esto es IMPORTANTE porque explica por qué el personaje no atraviesa el piso, cae cuando no hay plataforma, etc.

### El Motor de Física: Arcade Physics

Phaser tiene un motor de física integrado (`Arcade Physics`). Es como si el juego tuviera una **simulación de gravedad y colisiones**.

#### Paso 1: CREAR OBJETOS FÍSICOS

En `src/gameobjects/Player.js`:

```javascript
constructor({scene}) {
    super(scene, -190, 100, "player");
    this.scene = scene;
    this.scene.add.existing(this);
    
    // ← AQUÍ: Agregar física al personaje
    this.scene.physics.add.existing(this);
    // Ahora el personaje tiene:
    // - Gravedad aplicada
    // - Colisión detectada
    // - Velocidad (vx, vy)
}
```

**¿Qué significa `add.existing(this)`?**

Es decir: "Este personaje EXISTE en el mundo físico. Aplícale gravedad, detección de colisiones, etc."

#### Paso 2: CREAR PLATAFORMAS (Colisionables)

En `src/scenes/GameScene.js`:

```javascript
buildPlatformsFromData() {
    this.groundGroup = this.physics.add.staticGroup();
    
    // Para cada plataforma en el mapa:
    this._platformData.forEach((pd) => {
        // Crear un rectángulo invisible
        const rect = this.add.rectangle(pd.x, pd.y, pd.w, pd.h, 0x000000, 0);
        
        // Hacerlo ESTÁTICO (no se mueve)
        this.physics.add.existing(rect, true);
        
        // Agregarlo al grupo de plataformas
        this.groundGroup.add(rect);
    });
}
```

**¿Qué es `staticGroup`?**

Es un grupo de objetos **fijos** que no se mueven. Las plataformas son estáticas porque el piso no se mueve.

```
DINÁMICO (se mueve):
  - Personaje
  - Balas
  - Enemigos

ESTÁTICO (NO se mueve):
  - Piso
  - Plataformas
  - Paredes
```

#### Paso 3: CREAR COLISIONADORES

En `src/scenes/GameScene.js`:

```javascript
// Conectar el personaje con las plataformas
this._playerColliders.push(
    this.physics.add.collider(
        this.players[0].sprite,  // Objeto 1: Personaje
        this.groundGroup         // Objeto 2: Todas las plataformas
    )
);
```

**¿Qué hace el collider?**

Es como un **referee que verifica cada frame**:

```
FRAME 1:
  ¿El personaje toca una plataforma? → NO
  → Aplicar gravedad (personaje cae)

FRAME 2:
  ¿El personaje toca una plataforma? → SÍ
  → FRENAR la caída
  → El personaje está "parado"

FRAME 3:
  ¿El personaje toca una plataforma? → SÍ
  → Mantener en la plataforma
```

#### Paso 4: APLICAR GRAVEDAD

En `src/main.js`:

```javascript
physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 800 },  // ← Gravedad hacia abajo
        debug: false
    }
}
```

**¿Qué significa `gravity: { y: 800 }`?**

Significa: "Aplicar una aceleración de 800 píxeles/segundo² hacia abajo (Y positivo)".

**¿Cómo funciona?**

```
Velocidad Y del personaje = 0 (está parado)

FRAME 1: gravity actúa
  velocityY += 800 * delta
  velocityY += 800 * 0.016 = 12.8 píxeles/s

FRAME 2: gravity actúa
  velocityY += 12.8
  velocityY = 25.6 píxeles/s

FRAME 3: gravity actúa
  velocityY += 12.8
  velocityY = 38.4 píxeles/s

RESULTADO: El personaje acelera hacia abajo (cae más rápido cada frame)
           Pero si toca una plataforma, el collider detiene la caída.
```

### Resumen: El ciclo completo de la FÍSICA

```
CADA FRAME:
┌──────────────────────────────────┐
│ 1. APLICAR GRAVEDAD              │
│    velocityY += 800 * delta      │
│    personaje.y += velocityY      │
│                                  │
│ 2. VERIFICAR COLISIONES          │
│    ¿Personaje toca plataforma?   │
│    → SÍ: personaje.velocityY = 0 │
│    → NO: continúa cayendo        │
│                                  │
│ 3. REDIBUJAR                     │
│    personaje en nueva posición   │
└──────────────────────────────────┘
```

---

## ¿Cómo funciona la MAPA SELECCIÓN técnicamente?

Cuando seleccionas un mapa, el juego **carga los datos de plataformas**:

### Paso 1: DATOS DE MAPAS

En `src/scenes/GameScene.js`, cada mapa tiene **coordenadas hardcodeadas**:

```javascript
if (mapName === 'Mapa 1') {
    // Array de plataformas con sus posiciones
    this._platformData.push({
        x: 200,  // Posición horizontal
        y: 650,  // Posición vertical
        w: 160,  // Ancho
        h: 24    // Alto
    });
    
    this._platformData.push({
        x: 500,
        y: 500,
        w: 160,
        h: 24
    });
    // ... más plataformas
}
```

### Paso 2: DIBUJAR PLATAFORMAS

```javascript
buildPlatformsFromData() {
    // Para cada plataforma:
    this._platformData.forEach((pd) => {
        // Crear rectángulo en esa posición
        const rect = this.add.rectangle(
            pd.x,  // Centro X
            pd.y,  // Centro Y
            pd.w,  // Ancho
            pd.h   // Alto
        );
        
        // Hacer invisible (alpha: 0)
        // Agregar física
        // Agregar al grupo de plataformas
    });
}
```

**Visualización:**

```
PANTALLA DEL JUEGO (1024 x 768):
┌──────────────────────────┐
│ (0, 0)                   │
│                          │
│     ▢ Plat 1           │ Y=500
│    (200, 500)           │
│                          │
│ ▢ Plat 2            ▢  │ Y=650
│(100,650)  (500,650)    │
│                          │
│ ═════════════════════    │ Y=750 (Piso)
└──────────────────────────┘
(0, 768)
```

---

## ¿Cómo se actualiza todo cada frame?

Este es el **ciclo completo** del juego:

### El Update Loop (Ciclo de actualización)

Ocurre **60 veces por segundo**:

```
INICIO DEL FRAME
↓
[ENTRADA] Detectar teclas presionadas
  ├─ ¿ARRIBA presionada? → player.move("up")
  ├─ ¿ABAJO presionada? → player.move("down")
  └─ ¿ESPACIO presionada? → player.fire()
↓
[FÍSICA] Aplicar simulación de física
  ├─ Aplicar gravedad a todos los objetos
  ├─ Verificar colisiones
  ├─ Actualizar velocidades
  └─ Actualizar posiciones
↓
[ACTUALIZACIÓN] Ejecutar el método update() de cada objeto
  ├─ player.update() → Añadir movimiento sinusoidal
  ├─ enemy.update() → IA del enemigo
  ├─ bullet.update() → Mover bala
  └─ Otros objetos...
↓
[RENDERIZADO] Redibujar TODA la pantalla
  ├─ Borrar pantalla anterior
  ├─ Dibujar fondo
  ├─ Dibujar personaje
  ├─ Dibujar enemigo
  ├─ Dibujar balas
  ├─ Dibujar UI (vida, puntos)
  └─ Mostrar la pantalla al jugador
↓
ESPERAR 16ms (aproximadamente, para completar 60 frames/segundo)
↓
SIGUIENTE FRAME...
```

**Imagina que es como una película:**

```
Fotograma 1: Personaje en Y=400
Fotograma 2: Personaje en Y=395 (presionaste ARRIBA)
Fotograma 3: Personaje en Y=390
Fotograma 4: Personaje en Y=385
...

Tu ojo ve: Movimiento suave hacia arriba
```

---

---

## ¿Cómo elijo personaje?

Antes de jugar, el juego te lleva a una pantalla que dice **"Elige tu personaje"**.

### ¿Qué pasa?
1. Se abre `CharacterSelector` (una pantalla especial)
2. Ves varios personajes disponibles (Charles, etc.)
3. **Presionas ENTER o haces clic** en el personaje que quieras
4. El juego **guarda en tu sesión** cuál personaje elegiste
5. Te lleva a elegir el mapa

### ¿Cómo se guarda la elección?
```
Tu sesión = {
    username: "Tu nombre",
    character: "Charles",        ← Aquí se guarda
    difficulty: "Normal"
}
```

---

## ¿Cómo elijo el mapa?

Después de elegir personaje, va la pantalla de **selección de mapa**.

### ¿Qué pasa?
1. Se abre `MapSelector` (otra pantalla especial)
2. Ves los mapas disponibles:
   - **Mapa 1** → El mapa principal (con plataformas en diferentes alturas)
   - **Mapa 2** → Otro mapa diferente
3. **Presionas ENTER o haces clic** en el mapa que quieras
4. El juego **guarda en GameScene** cuál mapa va a usar
5. ¡COMIENZA LA BATALLA!

### ¿Cómo se construye el mapa?
El juego tiene una **lista de coordenadas** para cada mapa:

**Mapa 1** tiene esto:
- Plataforma izquierda en `X=200, Y=650`
- Plataforma del medio en `X=500, Y=500`
- Plataforma derecha en `X=800, Y=650`
- El piso abajo de todo en `Y=750`

El juego **dibuja rectángulos invisibles** en esas posiciones. Tu personaje NO puede atravesarlos (es como si fueran paredes):

```
PANTALLA:
┌────────────────────────┐
│                        │
│      ▢ (plataforma)    │
│                        │
│   ▢              ▢     │
│                        │
│ ═══════════════════════ │ ← PISO
└────────────────────────┘
```

**¿Cómo funciona la colisión?**
- El juego CONSTANTEMENTE chequea: "¿Mi personaje está tocando una plataforma?"
- Si la respuesta es SÍ → El personaje PARA (no cae)
- Si la respuesta es NO → El personaje CAE por la gravedad

---

## ¿Cómo se guardan mis partidas?

**IMPORTANTE**: Esto es lo que tu profe probablemente te preguntará.

### Paso a paso:

#### 1. CUANDO CREAS UNA CUENTA:
```
Tu navegador crea una carpeta invisible llamada "localStorage"
                            ↓
Dentro pone un archivo JSON llamado "gameSessions"
                            ↓
En ese archivo guarda TODOS tus datos:
{
    "tu_nombre_1234567890": {
        "username": "tu_nombre",
        "character": "Charles",
        "level": 1,
        "score": 0,
        "coins": 0,
        "createdAt": "2025-01-15T10:30:00Z",
        "totalPlayTime": 120   ← Minutos que jugaste
    }
}
```

#### 2. DURANTE EL JUEGO:
- Cada vez que matas un enemigo → Se actualiza `score`
- Cada vez que recoges una moneda → Se actualiza `coins`
- El juego **automáticamente** guarda en localStorage

#### 3. CUANDO TERMINA EL JUEGO:
- El juego calcula cuánto tiempo jugaste
- Suma ese tiempo al `totalPlayTime`
- Guarda TODO en localStorage

### ¿Dónde se guarda técnicamente?

**En el archivo `game.js`** hay un `SessionManager` que hace esto:

```javascript
SessionManager = {
    createSession() {
        // Crea tu sesión con los datos iniciales
        // La guarda en localStorage con tu nombre + timestamp
    },
    
    loadSession() {
        // Busca tu sesión en localStorage
        // La carga en memoria para que el juego la use
    },
    
    updateSessionProgress() {
        // Actualiza tu score, level, coins
        // Guarda los cambios en localStorage
    },
    
    endSession() {
        // Cuando terminas de jugar:
        // Calcula tiempo jugado
        // Suma a totalPlayTime
        // Guarda en localStorage
    }
}
```

**¿Qué es localStorage?**
Es como una pequeña base de datos que está DENTRO de tu navegador. No está en internet, está en tu PC. El juego puede guardar cosas ahí sin necesidad de un servidor.

---

## ¿Qué pasa en una batalla?

Cuando finalmente se abre `GameScene`, esto es lo que ocurre:

### 1. EL JUEGO CARGA:
- Se dibuja el **fondo** (imagen de decoración)
- Se dibuja el **piso**
- Se crean las **plataformas** (invisible rectangles)
- Aparece tu **personaje** (a la izquierda)
- Aparece el **enemigo** (a la derecha)

### 2. TÚ COMIENZAS A JUGAR:
- **Mueves tu personaje** con flechas ⬆️⬇️
- **Disparas con ESPACIO** o clic del ratón
- Tu bala vuela hacia el enemigo
- Si la bala toca al enemigo → **ENEMIGO RECIBE DAÑO**

### 3. EL ENEMIGO CONTRAATACA:
- El enemigo se mueve solo (inteligencia artificial)
- El enemigo dispara balas HACIA TI
- Si una bala del enemigo te toca → **TÚ RECIBES DAÑO**

### 4. LA BATALLA TERMINA:
- Si tu vida llega a 0 → **GAME OVER** 💀
- Si la vida del enemigo llega a 0 → **TÚ GANAS** 🎉
- Tu puntuación se actualiza
- Se abre la pantalla de `GameOverScene`

---

## Modo Versus vs Cooperativo

### MODO VERSUS (1v1):
- Hay **2 jugadores**
- Cada uno controla su personaje
- **OBJETIVO**: Destruir al otro jugador
- Es competitivo (tú vs yo)
- **¿Cómo?**:
  - Jugador 1 (izquierda): Flechas ⬆️⬇️ + ESPACIO para disparar
  - Jugador 2 (derecha): Otras teclas + Otro botón para disparar

### MODO COOPERATIVO:
- Hay **2 jugadores**
- **OBJETIVO**: Ambos juntos tienen que matar enemigos
- Es cooperativo (yo Y tú contra los enemigos)
- **¿Cómo?**:
  - Ambos jugadores comparten la MISMA energía/municiones
  - Si uno gasta municiones, ambos se quedan sin
  - Tienen que trabajar como equipo

---

## ¿Qué es Phaser 3 y por qué se usa?

**Phaser 3** es una librería JavaScript para hacer videojuegos 2D. Es como tener un kit de construcción listo con todo lo que necesitas:

### ¿Qué proporciona Phaser?

| Componente | ¿Qué hace? |
|-----------|-----------|
| **Motor de Física** | Gravedad, colisiones, velocidades |
| **Sistema de Sprites** | Dibuja imágenes y las anima |
| **Input Management** | Detecta teclado, ratón, joystick |
| **Tweens** | Animaciones suaves (movimiento, escala) |
| **Physics Groups** | Grupos de objetos para manejar colisiones |
| **Camera System** | Controla qué ve el jugador |
| **Events** | Sistema de señales (cuando pasa algo) |

### ¿Por qué se usa en este juego?

Sin Phaser, tendrías que programar MANUALMENTE:
- ❌ Detectar cuando el usuario presiona teclas
- ❌ Calcular si dos objetos se chocan
- ❌ Aplicar gravedad
- ❌ Animar sprites
- ❌ Renderizar (dibujar) en la pantalla

Con Phaser, simplemente LLAMAS A FUNCIONES:
```javascript
// Con Phaser (una línea):
this.physics.add.collider(player, platform);

// Sin Phaser (100+ líneas de código):
function checkCollision(player, platform) {
    // Calcular rectángulos bounding boxes
    // Verificar si se solapan en X
    // Verificar si se solapan en Y
    // Aplicar física manualmente
    // ...
}
```

**Conclusión:** Phaser nos permite escribir el juego en **500 líneas** en lugar de **5000**.

---

## ¿Cómo se carga el juego? (Preloader Scene)

Cuando abres el juego, ocurre esto en `src/preloader.js`:

### Paso 1: DETECTAR QUE ESTAMOS EN PRELOADER

En `src/main.js`, el orden de escenas es:
```javascript
scene: [
    LoginScene,      // 1. Primera escena (login)
    Preloader,       // 2. Segunda escena (cargar assets)
    Menu,
    CharacterSelector,
    MapSelector,
    GameScene,
    GameOverScene,
    // ...
]
```

### Paso 2: CARGAR IMÁGENES Y SPRITES

En el método `preload()`:

```javascript
preload() {
    // Establecer ruta base para todos los assets
    this.load.setPath("assets");
    
    // Cargar imágenes simples
    this.load.image("logo", "logo.png");
    this.load.image("player", "player/player.png");
    this.load.image("bullet", "player/bullet.png");
    
    // Cargar SPRITESHEETS (imágenes con múltiples frames para animaciones)
    this.load.spritesheet('caminar', 'player/pj2/pj2-caminar.png', {
        frameWidth: 64,
        frameHeight: 64
    });
    
    // Cargar fuentes de bitmap
    this.load.bitmapFont("pixelfont", "fonts/pixelfont.png", "fonts/pixelfont.xml");
}
```

**¿Qué es un SPRITESHEET?**

Es una imagen que contiene MÚLTIPLES FRAMES (fotogramas) para hacer animaciones:

```
IMAGEN CARGADA (caminar.png):
┌───────────────────────────┐
│ [Frame0] [Frame1] [Frame2]│
│ [Frame3] [Frame4] [Frame5]│
└───────────────────────────┘

Phaser carga así:
- frameWidth: 64 píxeles
- frameHeight: 64 píxeles
- Total: 6 frames (0 a 5)
```

Luego puedes animar usando esos frames:

```javascript
// Juega frames 0 a 5 en loop
this.anims.create({
    key: 'caminar',
    frames: this.anims.generateFrameNumbers('caminar', { start: 0, end: 5 }),
    frameRate: 5,      // 5 frames por segundo
    repeat: -1         // -1 = infinito
});

// Usar animación:
sprite.play('caminar');
```

### Paso 3: MOSTRAR BARRA DE PROGRESO

```javascript
this.load.on("progress", (progress) => {
    console.log("Loading: " + Math.round(progress * 100) + "%");
});
```

### Paso 4: CREAR ANIMACIONES

En el método `create()`:

```javascript
this.anims.create({
    key: 'disparo',
    frames: this.anims.generateFrameNumbers('disparo', { start: 0, end: 5 }),
    frameRate: 5,
    repeat: 0  // Solo una vez
});
```

### Paso 5: PASAR A SIGUIENTE ESCENA

```javascript
this.scene.start("SplashScene");
```

**¿Qué pasa si no cargas los assets en Preloader?**

Si intentas usar una imagen que NO cargaste → **ERROR ROJO** en la consola y el juego se rompe.

---

## ¿Cómo funciona LoginScene? (Autenticación con Google)

Esta es la **primera pantalla que ves** cuando abres el juego.

### Paso 1: MOSTRAR SESIONES GUARDADAS

En `game.js`, en `LoginScene.create()`:

```javascript
const sessions = SessionManager.getAllSessions();
const sessionsList = Object.values(sessions);

if (sessionsList.length > 0) {
    // Mostrar cada sesión guardada como un botón clickeable
    sessionsList.forEach((session) => {
        const sessionText = `${session.username} - Lvl ${session.progress.level}`;
        const button = this.add.text(...)
            .setInteractive()
            .on("pointerdown", () => {
                // Cargar esa sesión
                SessionManager.loadSession(session.id);
                this.scene.start("Preloader");
            });
    });
}
```

**Ejemplo:**
```
┌─────────────────────────────┐
│  Sesiones Guardadas:        │
│  ✓ Juan - Lvl 5 (Charles)   │
│  ✓ María - Lvl 3 (Sofia)    │
│  ✓ + NUEVA SESIÓN           │
└─────────────────────────────┘
```

### Paso 2: CREAR NUEVA SESIÓN CON GOOGLE

Si presionas "+ NUEVA SESIÓN":

```javascript
showCreateSessionForm() {
    // Renderizar botón de Google Sign-In
    google.accounts.id.renderButton(container, { theme: 'outline' });
    
    // Cuando el usuario inicia sesión:
    google.accounts.id.initialize({
        client_id: window.GOOGLE_CLIENT_ID,
        callback: (response) => {
            // response.credential = JWT token codificado
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const username = payload.name;
            
            // Crear sesión nueva
            const session = SessionManager.createSession(username);
            currentPlayer = session;
            
            // Continuar al juego
            this.scene.start("Preloader");
        }
    });
}
```

**¿Cómo funciona Google Sign-In?**

```
1. Presionas "Iniciar sesión con Google"
   ↓
2. Se abre popup de Google
   ↓
3. Ingresas tu usuario y contraseña de Google
   ↓
4. Google envía un TOKEN (JWT) al juego
   ↓
5. El juego DECODIFICA el token:
   - Obtiene tu nombre
   - Obtiene tu email
   ↓
6. Crea una sesión nueva con esos datos
```

**¿Qué es un JWT (JSON Web Token)?**

Es una cadena de texto codificada que contiene información:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJuYW1lIjoiSnVhbiIsImVtYWlsIjoianVhbkBnbWFpbC5jb20ifQ.
xyz...

           ↓ DECODIFICAR ↓

{
    "name": "Juan",
    "email": "juan@gmail.com"
}
```

---

## ¿Cómo funciona el ENEMIGO? (IA)

El enemigo es controlado por **inteligencia artificial**, no por otro jugador.

### Paso 1: CREAR EL ENEMIGO

En `src/gameobjects/BlueEnemy.js`:

```javascript
constructor(scene) {
    super(scene, scene.scale.width + 150, ...);
    // Posición inicial: fuera de pantalla a la derecha
    
    // Crear tweens (animaciones automáticas)
    this.up_down_tween = this.scene.tweens.add({
        targets: this,
        y: 85,                      // Ir hasta Y=85
        duration: 1000,             // En 1 segundo
        ease: Math.Easing.Sine.InOut,
        yoyo: true,                 // Ir y volver (como un péndulo)
        repeat: -1                  // Infinitamente
    });
    this.up_down_tween.pause();    // Pausado hasta que empiece la batalla
}
```

**¿Qué es un `tween`?**

Es una **animación automática** que el juego ejecuta sin que hagas nada:

```
TWEEN ARRIBA Y ABAJO:
Y=85        ╱╲ ╱╲ ╱╲     (arriba)
           ╱  ╲╱  ╲╱     (abajo)
Y=500     (oscila continuamente)

yoyo: true  = Ir y volver
repeat: -1  = Infinitamente
```

### Paso 2: ENTRAR AL JUEGO

Cuando comienza la batalla:

```javascript
start() {
    // Entrar desde derecha a izquierda
    this.scene.tweens.add({
        targets: this,
        x: this.scene.scale.width - 150,  // Posición final
        duration: 1000,
        delay: 1000,
        ease: "Power2",
        onComplete: () => {
            // Cuando termina de entrar, iniciar a oscilar
            this.up_down_tween.resume();
        }
    });
}
```

### Paso 3: DISPARAR (IA)

En `src/scenes/GameScene.js`, el loop actualiza al enemigo:

```javascript
update() {
    // Cada cierto tiempo, el enemigo dispara
    if (enemy_shoot_timer <= 0) {
        // Disparar HACIA el jugador
        enemy.damage(player.x, player.y);
        enemy_shoot_timer = random entre 1 y 3 segundos;
    }
    enemy_shoot_timer -= delta;
}
```

**¿Qué hace `enemy.damage(player.x, player.y)`?**

```javascript
damage(player_x, player_y) {
    // Obtener bala del pool del enemigo
    const bullet = this.bullets.get();
    
    if (bullet) {
        // Disparar HACIA las coordenadas del jugador
        bullet.fire(
            this.x,          // Desde posición X del enemigo
            this.y,          // Desde posición Y del enemigo
            player_x,        // Hacia X del jugador
            player_y         // Hacia Y del jugador
            "enemy-bullet"   // Tipo de bala (color diferente)
        );
    }
}
```

### Paso 4: RECIBIR DAÑO

```javascript
damage(player_x, player_y) {
    // ... disparar bala ...
    
    if (!this.animation_is_playing && this.scale_damage > 1) {
        if (this.damage_life_point === 0) {
            // Reducir escala (el enemigo se empequeñece)
            this.scene.tweens.add({
                targets: this,
                scale: --this.scale_damage,  // Escala - 1
                duration: 500,
                ease: "Elastic.In"
            });
            this.damage_life_point = 10;  // Reset contador
        } else {
            this.damage_life_point--;
        }
    }
    
    // Aumentar velocidad de oscilación (más difícil)
    this.up_down_tween.timeScale = 1 + (3 - this.scale_damage) / 2;
}
```

**¿Cómo muere el enemigo?**

```
Bala 1 golpea → scale_damage = 3 → Enemigo grande
Bala 2 golpea → scale_damage = 2 → Enemigo mediano
Bala 3 golpea → scale_damage = 1 → Enemigo pequeño
Bala 4 golpea → scale_damage = 0 → ¡ENEMIGO MUERE!
```

---

## ¿Cómo funciona el SISTEMA DE VIDA?

Cada personaje (jugador y enemigo) tiene **vidas/HP**.

### En el Jugador:

```javascript
// En GameScene:
const maxPlayerHealth = 100;
let playerHealth = maxPlayerHealth;

// Cuando una bala del enemigo toca al jugador:
this.physics.add.overlap(
    enemy.bullets,
    player.sprite,
    () => {
        playerHealth -= 10;  // Recibir 10 de daño
        
        if (playerHealth <= 0) {
            // ¡GAME OVER!
            this.scene.start("GameOverScene", { points: points });
        }
    }
);
```

### En el Enemigo:

```javascript
// Se usa scale_damage en lugar de un número directo
// scale_damage comienza en 4 (tamaño 4x)
// Cada golpe hace: scale_damage--
// Cuando scale_damage llega a 0 → ¡ENEMIGO MUERE!

// En GameScene:
this.physics.add.overlap(
    player.bullets,
    enemy,
    () => {
        enemy.scale_damage--;
        
        if (enemy.scale_damage === 0) {
            // ¡JUGADOR GANA!
            points += 100;
            this.scene.start("GameOverScene", { points: points });
        }
    }
);
```

---

## ¿Cómo funciona GameOverScene?

Cuando alguien muere, se va a esta pantalla.

### Paso 1: CREAR PANTALLA

En `src/scenes/GameOverScene.js`:

```javascript
create() {
    // Dibujar fondo
    this.add.image(0, 0, "background").setOrigin(0, 0);
    
    // Dibujar rectángulos para el texto
    this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        120,
        0xffffff
    );
    
    // Mostrar "GAME OVER"
    this.add.bitmapText(
        this.scale.width / 2,
        this.scale.height / 2,
        "knighthawks",
        "GAME\nOVER",
        62
    ).setOrigin(0.5, 0.5);
    
    // Mostrar puntos finales
    this.add.bitmapText(
        this.scale.width / 2,
        this.scale.height / 2 + 85,
        "pixelfont",
        `YOUR POINTS: ${this.end_points}`,
        24
    ).setOrigin(0.5, 0.5);
}
```

### Paso 2: GUARDAR PROGRESO

```javascript
// Actualizar sesión del jugador
SessionManager.updateSessionProgress({
    score: this.end_points,
    level: currentLevel,
    coins: coinsCollected,
    enemies_defeated: enemiesDefeated
});

// Esto guarda TODO en localStorage
```

### Paso 3: REINICIAR

```javascript
this.input.on("pointerdown", () => {
    // Presionar clic para volver al menú
    this.scene.start("MainScene");
});
```

---

## ¿Cómo funciona HudScene? (La interfaz)

Esta escena se ejecuta **en paralelo** a GameScene y muestra:
- Puntos
- Tiempo restante

### Paso 1: LANZAR HUD EN PARALELO

En `src/scenes/GameScene.js`:

```javascript
create() {
    // ... crear player, enemy, etc ...
    
    // Lanzar HudScene SIN cerrar GameScene
    this.scene.launch("HudScene", {
        remaining_time: 20  // segundos
    });
}
```

**¿Qué significa `launch`?**

```
scene.start() = Cerrar escena actual + abrir nueva
scene.launch() = Mantener escena actual + abrir nueva en paralelo

En este juego:
GameScene corre (el juego)
HudScene corre (los puntos en pantalla)
                ↓
Ambas se actualizan al mismo tiempo
```

### Paso 2: MOSTRAR INTERFAZ

En `src/scenes/HudScene.js`:

```javascript
create() {
    // Texto de puntos (arriba izquierda)
    this.points_text = this.add.bitmapText(
        10, 10,
        "pixelfont",
        "POINTS:0000",
        24
    );
    
    // Texto de tiempo restante (arriba derecha)
    this.remaining_time_text = this.add.bitmapText(
        this.scale.width - 10,
        10,
        "pixelfont",
        "REMAINING:20s",
        24
    ).setOrigin(1, 0);  // Alineado a la derecha
}
```

### Paso 3: ACTUALIZAR VALORES

```javascript
// Desde GameScene:
const hudScene = this.scene.get("HudScene");

// Cuando el jugador mata enemigo:
hudScene.update_points(points);

// Cada segundo:
hudScene.update_timeout(remaining_time);
```

---

## Modo Versus vs Cooperativo (en profundidad)

### MODO VERSUS (Competencia):

Hay **2 jugadores**, cada uno controla SU personaje:

```javascript
init(data) {
    this.mode = "versus";
    this.player1Index = 0;
    this.player2Index = 1;
}

create() {
    // Crear 2 jugadores
    this.players[0] = new Player({ scene: this });
    this.players[1] = new Player({ scene: this });
    
    // Jugador 1 controla: W = Arriba, S = Abajo, ESPACIO = Disparo
    // Jugador 2 controla: Flechas arriba/abajo, Q = Disparo
    
    // Las balas de P1 dañan a P2
    this.physics.add.overlap(
        this.players[0].bullets,
        this.players[1],
        () => {
            this.players[1].health -= 10;
        }
    );
    
    // Las balas de P2 dañan a P1
    this.physics.add.overlap(
        this.players[1].bullets,
        this.players[0],
        () => {
            this.players[0].health -= 10;
        }
    );
}
```

### MODO COOPERATIVO (Trabajo en equipo):

Hay **2 jugadores** contra **1 enemigo grande**:

```javascript
init(data) {
    this.mode = "cooperativo";
    this.sharedEnergy = 500;  // ← ENERGÍA COMPARTIDA
}

create() {
    // Crear 2 jugadores
    this.players[0] = new Player({ scene: this });
    this.players[1] = new Player({ scene: this });
    
    // Crear enemigo MÁS DIFÍCIL
    this.enemy = new BlueEnemy(this);
    this.enemy.scale_damage = 5;  // Más vida que en Versus
    
    // AMBAS balas dañan al enemigo
    this.physics.add.overlap(
        this.players[0].bullets,
        this.enemy,
        () => {
            this.enemy.damage(...);
            this.changeEnergyFor(this.players[0], -5);  // Consume energía
        }
    );
    
    this.physics.add.overlap(
        this.players[1].bullets,
        this.enemy,
        () => {
            this.enemy.damage(...);
            this.changeEnergyFor(this.players[1], -5);
        }
    );
    
    // Las balas del enemigo dañan a AMBOS
    this.physics.add.overlap(
        this.enemy.bullets,
        this.players[0],
        () => {
            this.players[0].health -= 10;
        }
    );
}

// Energía compartida (método especial):
changeEnergyFor(player, delta) {
    if (this.mode === 'cooperativo') {
        // Restar de la energía COMPARTIDA
        this.sharedEnergy = Math.max(0, this.sharedEnergy + delta);
    }
}
```

**Diferencia visual:**

```
VERSUS:                 COOPERATIVO:
┌──────────────────┐   ┌──────────────────┐
│ P1          P2   │   │ P1          P2   │
│  ❤❤❤       ❤❤❤   │   │  ❤❤❤       ❤❤❤   │
│                  │   │                  │
│   vs ENEMIGO 1   │   │  vs ENEMIGO 2    │
│      ❤❤❤         │   │  (MÁS GRANDE)    │
│                  │   │      ❤❤❤❤❤       │
└──────────────────┘   └──────────────────┘
```

---

## ¿Cómo se calcula el SCORE (Puntos)?

```javascript
// En GameScene:
let points = 0;

update() {
    // Cada vez que una bala del jugador toca al enemigo:
    this.physics.add.overlap(
        player.bullets,
        enemy,
        () => {
            points += 10;  // +10 puntos por bala
            enemy.damage(...);
        }
    );
    
    // Cuando enemigo muere:
    if (enemy.scale_damage === 0) {
        points += 100;  // +100 bonus por matar enemigo
        
        // Actualizar sesión
        SessionManager.updateSessionProgress({
            score: points
        });
        
        // Mostrar en HUD
        hudScene.update_points(points);
    }
    
    // Mostrar puntos en GameOverScene
    this.scene.start("GameOverScene", { points: points });
}
```

**Sistema de puntos:**

```
Acción                  Puntos
─────────────────────────────────
Disparo toca enemigo    +10
Enemigo muere           +100
Tiempo sin morir        +1 por segundo
Difícil completada      +50 bonus
```

---

## ControlsScene: Pantalla de Controles

Esta pantalla enseña al jugador qué botones presionar.

### Estructura:

```javascript
class ControlsScene extends Phaser.Scene {
    currentMenu = "main";  // main, basics, modes
}
```

### Paso 1: MENÚ PRINCIPAL

Muestra 2 botones:

```
┌─────────────────────────────────┐
│  CONTROLES (título)             │
│                                 │
│  ┌──────────┐    ┌──────────┐  │
│  │CONTROLES │    │MODOS DE  │  │
│  │BÁSICOS   │    │JUEGO     │  │
│  └──────────┘    └──────────┘  │
│                                 │
│         [VOLVER]                │
└─────────────────────────────────┘
```

**Código:**

```javascript
showMainMenu() {
    const rect1 = this.add.rectangle(btn1X, btn1Y, btnWidth, btnHeight, 0x004466);
    rect1.setInteractive()
        .on('pointerdown', () => this.showBasicsMenu());
    
    const rect2 = this.add.rectangle(btn2X, btn2Y, btnWidth, btnHeight, 0x004466);
    rect2.setInteractive()
        .on('pointerdown', () => this.showModesMenu());
}
```

### Paso 2: MOSTRAR CONTROLES BÁSICOS

```javascript
showBasicsMenu() {
    this.currentMenu = "basics";
    
    // Mostrar botones de controles:
    // MOVIMIENTO: A/D ← ↑ →
    // ATAQUE: X / K
    // SALTAR: W / Space
    // etc.
}
```

### Paso 3: VOLVER AL MENÚ ANTERIOR

```javascript
this.input.keyboard.on('keydown-ESC', () => {
    if (this.currentMenu === "main") {
        this.scene.start("Menu");
    } else {
        this.showMainMenu();  // Volver al anterior
    }
});
```

---

## SplashScene: Pantalla de Presentación

Es la pantalla que ves al principio con el logo.

### Código:

```javascript
export class SplashScene extends Scene {
    create() {
        const logo = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            "logo"
        );
        
        // Agregar efecto de brillo
        const fx = logo.postFX.addShine(1, 0.2, 5);
        
        // Esperar 2 segundos
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                // Fade out (desvanecimiento)
                const main_camera = this.cameras.main.fadeOut(1000, 0, 0, 0);
                
                // Cuando el fade out termina:
                main_camera.once("camerafadeoutcomplete", () => {
                    this.scene.start("MainScene");
                });
            }
        });
    }
}
```

**¿Qué pasa?**

```
t=0ms:    Logo aparece con efecto de brillo ✨
t=2000ms: Comienza a desvanecerse (fade out)
t=3000ms: Pantalla completamente negra
          → Cambiar a MainScene
```

---

## Sistema de Música Global

El juego tiene funciones que MANEJAN la música en todo momento.

### Paso 1: MÚSICA DE MENÚ

```javascript
function ensureMenuMusic(scene) {
    try {
        const game = scene.game;
        
        // Si ya existe música de menú, usarla
        if (game.menuMusic && !game.menuMusic.isDestroyed) {
            if (!game.menuMusic.isPlaying) {
                game.menuMusic.play();
            }
            return;
        }
        
        // Crear nueva música de menú
        try {
            game.menuMusic = scene.sound.add("menu_music", {
                loop: true,    // Repetir infinitamente
                volume: 0.5    // Volumen 50%
            });
            game.menuMusic.play();
        } catch (e) {
            // Si falla WebAudio, usar HTMLAudio
            const tag = new Audio("/assets/musica-menu.mp3");
            tag.loop = true;
            tag.volume = 0.5;
            game.menuMusicTag = tag;
            tag.play().catch(() => {});
        }
    } catch (e) { /* ignore */ }
}
```

**¿Cómo se usa?**

En `LoginScene`, `Menu`, `ControlsScene`, etc.:

```javascript
create() {
    // ... mostrar UI ...
    ensureMenuMusic(this);  // ← Reproducir música
}
```

### Paso 2: MÚSICA DE BATALLA

```javascript
function ensureBattleMusic(scene) {
    // Similar a ensureMenuMusic, pero con "battle_music"
    game.battleMusic = scene.sound.add("battle_music", {
        loop: true,
        volume: 0.5
    });
}
```

**Cuándo se usa:**

En `GameScene`, cuando comienza la batalla:

```javascript
create() {
    // ... crear jugadores, enemigo ...
    ensureBattleMusic(this);  // ← Música de pelea
}
```

### Paso 3: DETENER MÚSICA

```javascript
function stopMenuMusic(scene) {
    // Detener música de menú
    if (game.menuMusic && game.menuMusic.isPlaying) {
        game.menuMusic.stop();
        game.menuMusic = null;
    }
    // También detener HTMLAudio
    if (game.menuMusicTag) {
        game.menuMusicTag.pause();
        game.menuMusicTag = null;
    }
}
```

---

## Sistema de Manejo de Errores Global

El juego **captura TODOS los errores** para evitar crashes silenciosos.

### En `src/core/common.js`:

```javascript
window.addEventListener('error', (e) => {
    console.warn('Global error caught:', e.message, e.filename);
    if (e.error && e.error.stack) {
        console.warn(e.error.stack);
    }
});

window.addEventListener('unhandledrejection', (ev) => {
    console.warn('Unhandled promise rejection:', ev.reason);
});
```

**¿Qué pasa si hay un error?**

```
Normalmente (sin handler):
  → El juego se congela
  → La consola muestra un error rojo
  → El usuario no ve qué pasó

Con handler global:
  → El error se registra en consola
  → El juego INTENTA continuar
  → Más fácil de debuggear
```

### En `game.js`:

```javascript
// Patch para prevenir errores de removeAllListeners
if (Phaser.GameObjects && Phaser.GameObjects.GameObject) {
    const originalRemoveAllListeners = 
        Phaser.GameObjects.GameObject.prototype.removeAllListeners;
    
    Phaser.GameObjects.GameObject.prototype.removeAllListeners = function(event) {
        try {
            if (this.scene && originalRemoveAllListeners) {
                return originalRemoveAllListeners.call(this, event);
            }
        } catch (e) {
            // Ignorar el error
            return this;
        }
    };
}
```

---

## MainScene: La Batalla Simple

Esta es la escena de **prueba/demo** donde juegas contra el enemigo en tiempo real.

### Paso 1: SETUP INICIAL

```javascript
export class MainScene extends Scene {
    player = null;
    enemy_blue = null;
    cursors = null;
    points = 0;
    game_over_timeout = 20;  // 20 segundos
}
```

### Paso 2: CREAR OBJETOS

```javascript
create() {
    // Dibujar fondo
    this.add.image(0, 0, "background").setOrigin(0, 0);
    this.add.image(0, this.scale.height, "floor").setOrigin(0, 1);
    
    // Crear jugador
    this.player = new Player({ scene: this });
    
    // Crear enemigo
    this.enemy_blue = new BlueEnemy(this);
    
    // Crear teclas de cursor
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Lanzar menú en paralelo (overlay)
    this.scene.launch("MenuScene");
}
```

### Paso 3: DETECTAR COLISIONES

```javascript
// Bala del jugador toca enemigo
this.physics.add.overlap(
    this.player.bullets,
    this.enemy_blue,
    (enemy, bullet) => {
        bullet.destroyBullet();              // Destruir bala
        this.enemy_blue.damage(...);         // Dañar enemigo
        this.points += 10;                   // +10 puntos
        this.scene.get("HudScene")
            .update_points(this.points);     // Actualizar pantalla
    }
);

// Bala del enemigo toca jugador
this.physics.add.overlap(
    this.enemy_blue.bullets,
    this.player,
    (player, bullet) => {
        bullet.destroyBullet();
        this.cameras.main.shake(100, 0.01); // Efecto de sacudida
        this.cameras.main.flash(300, 255, 10, 10); // Flash rojo
        this.points -= 10;                   // -10 puntos
    }
);
```

### Paso 4: UPDATE LOOP

```javascript
update() {
    this.player.update();      // Actualizar jugador
    this.enemy_blue.update();  // Actualizar enemigo
    
    // Detección de entrada (cada frame)
    if (this.cursors.up.isDown) {
        this.player.move("up");
    }
    if (this.cursors.down.isDown) {
        this.player.move("down");
    }
}
```

### Paso 5: GAME OVER TIMEOUT

```javascript
// Evento desde MenuScene (cuando presionas "PLAY")
this.game.events.on("start-game", () => {
    this.scene.stop("MenuScene");
    this.scene.launch("HudScene", { remaining_time: 20 });
    this.player.start();
    this.enemy_blue.start();
    
    // Contar hacia atrás cada segundo
    this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            if (this.game_over_timeout === 0) {
                // Tiempo acabó
                this.scene.stop("HudScene");
                this.scene.start("GameOverScene", { 
                    points: this.points 
                });
            } else {
                this.game_over_timeout--;
                this.scene.get("HudScene")
                    .update_timeout(this.game_over_timeout);
            }
        }
    });
});
```

---

## Sistema de Carga de Personajes

El Preloader carga **4 personajes** con sus spritesheets.

### Mapeo de Personajes:

```javascript
const mapping = {
    repo1: {
        // Charles (pj1) - Ataque de puño
        walk: "pj1/pj1-caminar.png",
        idle: "pj1/pj1-golpe.png",
        punch: "pj1/pj1-golpe.png",
        block: "pj1/pj1-bloqueo-energia.png",
        charge: "pj1/pj1-bloqueo-energia.png"
    },
    repo2: {
        // Sofía (pj2) - Disparo
        walk: "pj2/pj2-disparo.png",
        idle: "pj2/pj2-disparo.png",
        shoot: "pj2/pj2-disparo.png",
        punch: "pj2/pj2-disparo.png"
    },
    repo3: {
        // Franchesca (pj3) - Ataque robótico
        walk: "pj3/pj3-caminar.png",
        idle: "pj3/pj3-caminar.png",
        shoot: "pj3/pj3-disparo.png",
        punch: "pj3/pj3-ataque2.png"
    },
    repo4: {
        // Mario (pj4) - Golpe especial
        walk: "pj4/pj4-golpe.png",
        idle: "pj4/pj4-golpe.png",
        punch: "pj4/pj4-golpe.png",
        shoot: "pj4/pj4-golpe.png"
    }
};
```

### Cómo se cargan:

```javascript
preload() {
    this.load.setPath("assets/player");
    
    // Cargar CADA personaje como spritesheet
    Object.keys(mapping).forEach((repoKey, idx) => {
        const charIndex = idx;  // 0, 1, 2, 3
        const m = mapping[repoKey];
        
        for (const action in m) {
            const key = `char${charIndex}_${action}`;  // ej: char0_walk
            this.load.spritesheet(
                key,
                m[action],  // ruta de imagen
                {
                    frameWidth: 64,
                    frameHeight: 64
                }
            );
        }
    });
}
```

**Resultado:**

Se cargan estas claves:
- `char0_walk`, `char0_idle`, `char0_punch`, `char0_block`
- `char1_walk`, `char1_idle`, `char1_shoot`, `char1_punch`
- `char2_walk`, `char2_idle`, `char2_shoot`, `char2_punch`
- `char3_walk`, `char3_idle`, `char3_punch`, `char3_shoot`

---

## Sistema de Variables Globales

En `src/core/common.js`:

```javascript
var isEnglish = false;  // Bandera de idioma (español por defecto)

function getPad(idx, scene) {
    const pads = scene.input.gamepad.gamepads;
    if (!pads || !pads.length) return null;
    return pads[idx] || null;
}

// Exponer al window para que otros scripts las accedan
if (typeof window !== 'undefined') {
    window.isEnglish = isEnglish;
    window.getPad = getPad;
}
```

**¿Cómo se usa?**

```javascript
// En cualquier escena:
if (isEnglish) {
    this.add.text(x, y, "PLAY");
} else {
    this.add.text(x, y, "JUGAR");
}
```

---

## Sistema de Traducciones

En `src/services/translations.js`:

### Paso 1: CARGAR TRADUCCIONES

```javascript
export async function getTranslations(lang, callback) {
    if (!lang || lang === 'es') {
        // Español es el idioma por defecto
        if (callback) callback();
        return;
    }
    
    const PROJECT_ID = import.meta.env.VITE_TRADUCILA_PROJECT_ID;
    
    try {
        const res = await fetch(
            `https://traducila.vercel.app/api/translations/${PROJECT_ID}/${lang}`
        );
        const data = await res.json();
        translations = data;
        
        // Guardar en localStorage para offline
        localStorage.setItem('translations', JSON.stringify(data));
        
        if (callback) callback();
    } catch (e) {
        console.warn('Failed to fetch translations', e);
    }
}
```

### Paso 2: OBTENER FRASES TRADUCIDAS

```javascript
export function getPhrase(key) {
    if (!key) return '';
    
    // Buscar en cache o localStorage
    if (!translations) {
        try {
            const locals = localStorage.getItem('translations');
            translations = locals ? JSON.parse(locals) : null;
        } catch (e) {}
    }
    
    // Si no hay traducción, retornar la clave original
    let phrase = key;
    
    if (translations && translations.data && translations.data.words) {
        const translation = translations.data.words.find(
            item => item.key === key
        );
        
        if (translation && translation.translate) {
            phrase = translation.translate;
        }
    }
    
    return phrase;
}
```

**Ejemplo:**

```javascript
// En una escena:
const text1 = getPhrase("PLAY");  // "JUGAR" en español
                                  // "PLAY" en inglés

this.add.text(x, y, text1);
```

---

## Resumen: Todas las escenas en orden

```
1. INDEX.HTML
   ↓ Carga Phaser + game.js

2. SRC/MAIN.JS
   ↓ Configura Phaser (tamaño, física, escenas)

3. LOGINSCENE
   ↓ Google Sign-In o cargar sesión anterior

4. PRELOADER
   ↓ Cargar imágenes, sonidos, fuentes

5. SPLASHSCENE
   ↓ Pantalla de presentación (opcional)

6. MENUSCENE
   ↓ Menú principal

7. CONTROLSSCENE
   ↓ Mostrar controles

8. CHARACTERSELECTOR
   ↓ Elegir personaje (Charles, Sofia, Mario, etc.)

9. MAPSELECTOR
   ↓ Elegir mapa (Mapa 1, Mapa 2, etc.)

10. GAMESCENE + HUDSCENE (en paralelo)
    ↓ BATALLA REAL
    ├─ Detectar input
    ├─ Aplicar física
    ├─ Actualizar HUD
    └─ Cuando alguien muere: →

11. GAMEOVERSCENE
    ↓ Mostrar puntos
    ↓ Guardar progreso en SessionManager
    ↓ Volver a MENUSCENE
```

---

| Archivo | ¿Qué hace? |
|---------|-----------|
| `game.js` | Crea todas las pantallas (Login, Menu, etc) + Sistema de sesiones |
| `src/main.js` | Configura Phaser (tamaño, física, gravedad) |
| `src/scenes/GameScene.js` | La batalla (dónde ocurre todo) |
| `src/gameobjects/Player.js` | Tu personaje (movimiento, disparo) |
| `src/gameobjects/BlueEnemy.js` | El enemigo azul |
| `src/gameobjects/Bullet.js` | Las balas que disparan |
| `public/mapas/` | Los datos de cada mapa (coordenadas) |
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
```

---

## MECÁNICAS DE BLOQUEO Y CARGA

Estas son las acciones defensivas y ofensivas especiales del juego.

### ¿Cómo funciona el BLOQUEO?

El bloqueo es cuando tu personaje **se protege de los ataques enemigos**.

#### Paso 1: ACTIVAR BLOQUEO (Distancia cercana)

Cuando presionas C (P1) o L (P2), el juego verifica la distancia al enemigo:

```javascript
const other = this.players[1 - i];
const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, other.sprite.x, other.sprite.y);
const chargeDistance = 140;  // Umbral importante

if (blockOrCharge) {  // Presionaste el botón de bloquear
    if (dist > chargeDistance) {
        // CARGAR ENERGÍA (porque está lejos)
        // (ver siguiente sección)
    } else {
        // BLOQUEAR (porque está cerca)
        player.blocking = true;
        sprite.setTint(0x336633);  // Color verde = bloqueando
    }
}
```

**¿Qué significa "distancia cercana"?**

```
Si la distancia es MENOR a 140 píxeles = Bloqueo
Si la distancia es MAYOR a 140 píxeles = Carga (ver abajo)

Visualización:
┌─────────────────────────────────────────┐
│ P1          [140px]          P2         │
│ Distancia > 140 = CARGAR                │
│                                         │
│ P1    [140px]    P2                     │
│ Distancia < 140 = BLOQUEAR              │
└─────────────────────────────────────────┘
```

#### Paso 2: EFECTO DEL BLOQUEO

Mientras bloqueas:

```javascript
if (player.blocking) {
    sprite.setTint(0x336633);  // Color verde oscuro
    
    // Intentar mostrar animación de bloqueo
    const blockKey = `char${charIndex}_block`;
    if (this.textures.exists(blockKey)) {
        sprite.setTexture(blockKey);
        sprite.setFrame(1);  // Frame de bloqueo
    }
}
```

**Lo que sucede:**

1. **No puedes moverte** → `sprite.setVelocityX(0)`
2. **No puedes disparar** → Las balas no se crean
3. **No puedes golpear** → El punch no funciona
4. **Solo puedes bloquear** → Esperar a que terminen los ataques

#### Paso 3: DAÑO AL BLOQUEAR

**IMPORTANTE**: Bloquear NO elimina todo el daño. El jugador que bloquea **RECIBE DAÑO PASIVO**.

```javascript
// En el update() principal:
const p = this.players[i];

if (p.blockingDamageEnd && time < p.blockingDamageEnd) {
    // El jugador está recibiendo daño por bloquear
    const dt = this.game.loop.delta / 1000;  // Segundos
    p.health = Math.max(0, p.health - (p.blockingDamagePerSecond || 0) * dt);
}
```

**Ejemplo real:**

```
P1 presiona BLOQUEAR
├─ blockingDamagePerSecond = 50
├─ blockingDamageEnd = time + 3000  (3 segundos)
│
├─ FRAME 1 (t=0ms):  P1.health = 1000
├─ FRAME 1 (t=16ms): P1.health -= 50 * 0.016 = -0.8
├─ FRAME 1 (t=32ms): P1.health -= 50 * 0.016 = -0.8
│
├─ Después de 3 segundos:
├─ P1.health = 1000 - (50 * 3) = 1000 - 150 = 850
│
└─ P1 pierde 150 HP por bloquear 3 segundos
```

**¿Por qué?** El bloqueo es defensivo pero CASTIGA al jugador que lo mantiene. Esto fuerza estrategia:
- Bloquear solo cuando sea necesario
- Soltar el bloqueo para recuperarse
- Alternar entre movimiento y defensa

#### Paso 4: TERMINAR BLOQUEO

Cuando sueltas C/L:

```javascript
} else {
    player.blocking = false;
    
    // Restaurar colores originales
    if (sprite.clearTint) sprite.clearTint();
    
    // Restaurar textura normal (idle)
    const idleKey = `char${charIndex}_idle`;
    if (this.textures.exists(idleKey)) {
        sprite.setTexture(idleKey);
        sprite.setFrame(0);
    }
}
```

### ¿Cómo funciona la CARGA DE ENERGÍA?

Cuando estás **LEJOS del enemigo** (>140px) y presionas C/L:

#### Paso 1: ACTIVAR CARGA

```javascript
if (blockOrCharge && dist > chargeDistance) {
    // CARGAR ENERGÍA
    
    // En modo cooperativo, AMBOS deben estar cargando
    if (this.mode === 'cooperativo') {
        const p1Pad = getPad(p1.padIndex, this);
        const p2Pad = getPad(p2.padIndex, this);
        const p1Charging = p1Pad && p1Pad.buttons[0] && p1Pad.buttons[0].pressed;
        const p2Charging = p2Pad && p2Pad.buttons[0] && p2Pad.buttons[0].pressed;
        
        if (!(p1Charging && p2Charging)) {
            // Si no ambos cargan, cancelar
            player.chargingShot = false;
            player.chargeAmount = 0;
            return;
        }
    }
    
    // COMENZAR CARGA
    if (!player.chargingShot) {
        player.chargingShot = true;
        player.chargeAmount = 0;
        player.chargeStart = time;
    }
}
```

#### Paso 2: ACUMULAR ENERGÍA

Mientras mantienes presionado:

```javascript
// Tiempo delta (16ms por frame a 60 FPS)
const dt = this.game.loop.delta / 1000;  // Convierte a segundos

// Tasa de carga: 160 energía por segundo
const energyRate = 160;

// Calcular cuánta energía consumir este frame
const consume = Math.min(
    this.getEnergy(player),  // No más que la energía disponible
    energyRate * dt
);

// Restar del pool de energía
this.changeEnergyFor(player, -consume);

// Sumar a la carga acumulada
player.chargeAmount = (player.chargeAmount || 0) + consume;
```

**Visualización de carga:**

```
ENERGÍA INICIAL: 500
TASA: 160 energía/segundo

t=0ms:      chargeAmount = 0,   energy = 500
t=100ms:    chargeAmount = 16,  energy = 484
t=500ms:    chargeAmount = 80,  energy = 420
t=1000ms:   chargeAmount = 160, energy = 340
t=3125ms:   chargeAmount = 500, energy = 0  (máximo cargado)
```

#### Paso 3: FEEDBACK VISUAL

En coop, el reticle (círculo apuntador) **CRECE** mientras cargas:

```javascript
if (this.reticle) {
    // Escala del reticle basada en carga
    const scale = 1 + Math.min(1.2, player.chargeAmount / 240);
    this.reticle.setScale(scale);  // Crece a máximo 2.2x
}
```

**Ejemplo:**

```
chargeAmount = 0     →  reticle.scale = 1.0
chargeAmount = 120   →  reticle.scale = 1.5
chargeAmount = 240+  →  reticle.scale = 2.2 (máximo)
```

#### Paso 4: DISPARAR CON CARGA

Cuando SUELTAS el botón (después de cargar):

```javascript
if (chargeReleased && player.chargingShot) {
    // Calcular daño basado en carga
    const baseDamage = 20;
    const steps = Math.floor((player.chargeAmount || 0) / 25);  // Por cada 25 de carga
    const damage = baseDamage + (steps * 3);
    
    // Ejemplos:
    // chargeAmount = 0     →  damage = 20
    // chargeAmount = 25    →  damage = 20 + 3 = 23
    // chargeAmount = 50    →  damage = 20 + 6 = 26
    // chargeAmount = 100   →  damage = 20 + 12 = 32
    // chargeAmount = 250   →  damage = 20 + 30 = 50 (máximo)
    
    // Disparar con este daño
    this.spawnProjectile(playerIndex, damage);
    
    // Reset
    player.chargingShot = false;
    player.chargeAmount = 0;
}
```

**¿Cómo funciona matemáticamente?**

```
Paso 1: Contar "pasos" de 25 unidades
  steps = floor(chargeAmount / 25)
  
  chargeAmount = 87
  steps = floor(87 / 25) = floor(3.48) = 3

Paso 2: Multiplicar por 3 daño extra por paso
  bonus = steps * 3 = 3 * 3 = 9

Paso 3: Sumar al daño base
  totalDamage = 20 + 9 = 29
```

---

## MECÁNICA DE GOLPE (PUNCH/HIT)

El golpe es el ataque cuerpo a cuerpo del jugador.

### Paso 1: DETECTAR GOLPE

Cuando presionas X (P1) o K (P2):

```javascript
if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) {
    punch = true;
}

// O en gamepad:
if (btn[2] && btn[2].pressed && !pad._lastButtons[2]) {
    punch = true;  // Botón X del Xbox
}
```

**JustDown() = tecla presionada ESTE frame (no frame anterior)**

### Paso 2: VERIFICAR COOLDOWN

```javascript
// Cada personaje tiene un cooldown entre golpes
const punchCD = 350;  // milisegundos entre golpes

if (punch && (time - player.lastPunch) > punchCD) {
    player.lastPunch = time;  // Registrar último golpe
    this.doPunch(playerIndex);
}
```

**¿Por qué cooldown?**

```
Sin cooldown: El jugador presiona X rápidamente = golpes infinitos = GAME BROKEN

Con cooldown (350ms):
Frame 1:   Presionas X → Golpe conecta, lastPunch = time
Frame 22:  Presionas X → Ignora (tiempo < lastPunch + 350)
Frame 25:  Presionas X → Golpe conecta nuevamente

Resultado: Máximo 2-3 golpes por segundo
```

### Paso 3: EJECUTAR GOLPE

```javascript
doPunch(playerIndex) {
    const player = this.players[playerIndex];
    
    // Lock action para 450ms (tiempo de animación)
    player._lockedAction = 'punch';
    player.actionLockUntil = this.time.now + 450;
    
    // Reproducir animación de golpe
    const animKey = `char${charIndex}_punch`;
    sprite.anims.play(animKey, false);  // false = no loop
}
```

**¿Qué es "lock action"?**

Es un sistema que MANTIENE la animación de golpe visible durante 450ms, aunque el jugador suelte el botón:

```
t=0ms:     Presionas X
           → punch = true
           → doPunch() se ejecuta
           → player.actionLockUntil = time + 450

t=100ms:   Sueltas X
           → punch = false (para este frame)
           → PERO actionLockUntil aún no expiró
           → Mantiene animación de golpe

t=450ms:   Se cumple actionLockUntil
           → action vuelve a "idle"
           → Animación de golpe termina
```

### Paso 4: DAÑO DEL GOLPE

**IMPORTANTE**: El golpe hace daño en OVERLAPS, pero SOLO si el enemigo está en el rango correcto.

**Actualmente en el juego**: El daño del golpe se maneja en los callbacks de overlap, pero hay código preparado para implementar:

```javascript
// Pseudocódigo - no está completamente implementado:

// Crear hit box invisible alrededor del personaje
const hitBox = this.add.zone(sprite.x + 30, sprite.y, 50, 60);
this.physics.add.existing(hitBox);

// Detectar overlap con enemigo
this.physics.add.overlap(
    hitBox,
    enemy,
    () => {
        // Solo hacer daño si el golpe está "activo"
        if (player._lockedAction === 'punch' && 
            this.time.now < player.actionLockUntil) {
            
            // Aplicar daño
            this.applyDamageToPlayer(enemyIndex, 30);  // 30 daño de puño
            
            // Stun corto (0.2 segundos)
            enemy.beingHit = true;
            enemy.hitTimer = this.time.now + 200;
        }
    }
);
```

---

## MECÁNICA DE DISPAROS APUNTADOS

El sistema de disparos permite **apuntar y disparar** en dirección del cursor o reticle.

### Paso 1: DETECTAR DISPARO

```javascript
if (Phaser.Input.Keyboard.JustDown(this.keysP1.shoot)) {
    shoot = true;
}

// O en gamepad (Botón B = disparar)
if (btn[1] && btn[1].pressed && !pad._lastButtons[1]) {
    shoot = true;
}
```

### Paso 2: VERIFICAR COOLDOWN Y ENERGÍA

```javascript
const shotCD = 400;  // milisegundos entre disparos
const energyCost = 100;  // energía por disparo

if (shoot && 
    (time - player.lastShot) > shotCD && 
    this.getEnergy(player) >= energyCost) {
    
    player.lastShot = time;
    this.changeEnergyFor(player, -energyCost);
    this.spawnProjectile(playerIndex);
}
```

### Paso 3: CALCULAR DIRECCIÓN (AIMING)

**En modo VERSUS**: Disparas hacia la posición del enemigo

```javascript
spawnProjectile(playerIndex, customDamage) {
    const shooter = this.players[playerIndex];
    const target = this.players[1 - playerIndex];  // El otro jugador
    
    // Crear proyectil desde el pool
    const projectile = this.projectiles.create(
        shooter.sprite.x + 16,
        shooter.sprite.y + 5
    );
    
    // Calcular dirección
    const direction = new Phaser.Math.Vector2(
        target.sprite.x - shooter.sprite.x,
        target.sprite.y - shooter.sprite.y
    ).normalize();  // ← Normalizar = conversión a dirección unitaria
    
    // Aplicar velocidad
    projectile.setVelocity(
        direction.x * 450,  // 450 píxeles/segundo
        direction.y * 450
    );
}
```

**¿Qué significa normalize()?**

```
Vector sin normalizar:
  (800 - 100, 300 - 200) = (700, 100)
  
  Si aplicamos esto como velocidad: bala se mueve 700px en X, 100px en Y
  → MUY RÁPIDO, diagonal no balanceada

Vector normalizado:
  (700, 100).normalize() = (0.985, 0.141)
  
  Multiplica por velocidad: (0.985 * 450, 0.141 * 450) = (443.2, 63.5)
  → Velocidad consistente de 450 píxels/segundo en dirección diagonal
```

**En modo COOPERATIVO**: Disparas hacia el RETICLE

```javascript
if (this.mode === 'cooperativo' && i === 1) {
    // P2 controla la retícula (círculo amarillo que orbita)
    
    // Mover retícula con analog stick
    const ax = pad.axes[0].getValue();
    const ay = pad.axes[1].getValue();
    this.reticle.x = shooter.sprite.x + ax * 300;
    this.reticle.y = shooter.sprite.y + ay * 300;
    
    // Cuando dispara, apunta HACIA la retícula
    spawnProjectile(playerIndex, targetX = this.reticle.x, targetY = this.reticle.y);
}
```

### Paso 4: APLICAR DAÑO

```javascript
// En el overlap detector:
this.physics.add.overlap(
    this.projectiles,
    this.players[1].sprite,
    (projectile, player) => {
        const damage = projectile.damage || 20;
        this.applyDamageToPlayer(1, damage);
        projectile.destroy();
    }
);
```

---

## HABILIDADES ESPECIALES Y COMBOS

Cada personaje tiene habilidades **únicas** que se activan con combinaciones de botones.

### Sistema de Buffers de Combo

Cada jugador tiene buffers para detectar secuencias de botones:

```javascript
player.specialBuffer = [];        // Buffer de botones presionados
player.specialActive = false;     // ¿Se activó un especial?
player.specialTimer = 0;          // Contador para expiración

// Otros buffers específicos por personaje:
player.transformBuffer = [];      // Para transformación (Charles)
player.explosionBuffer = [];      // Para explosión (Charles)
player.sofiaLaserBuffer = [];     // Para láser (Sofía)
player.sofiaTeleportBuffer = [];  // Para teletransporte (Sofía)
// ... etc
```

### Detección de Combos

Después de cada input, se verifica si coincide con un combo:

```javascript
// Cuando presionas un botón:
player.specialBuffer.push(buttonPressed);

// Mantener solo los últimos N botones
if (player.specialBuffer.length > 5) {
    player.specialBuffer.shift();  // Remover el más antiguo
}

// Verificar si el buffer coincide con un combo conocido
checkForCombo(player, charIndex) {
    const buffer = player.specialBuffer;
    
    // Ejemplo: Combo "Arriba, Arriba, Golpe" = Habilidad especial
    if (buffer.length >= 3 &&
        buffer[buffer.length - 3] === 'up' &&
        buffer[buffer.length - 2] === 'up' &&
        buffer[buffer.length - 1] === 'punch') {
        
        player.specialActive = true;
        player.specialTimer = this.time.now + 3000;
        executeCombo_UpUpPunch(player);
    }
}
```

---

## HABILIDADES ÚNICAS POR PERSONAJE

### 1. CHARLES (pj1) - El Guerrero

**Personaje:** Charles es fuerte y defensivo, especializado en ataques de poder.

**Habilidades especiales:**

#### Combo 1: TRANSFORMACIÓN (R + R + X)
- **Entrada**: R presionado dos veces + Golpe (X)
- **Efecto**: Charles se transforma en una versión más grande y poderosa
- **Duración**: 3 segundos
- **Beneficio**: 
  - Golpes hacen 50% más daño
  - Más rápido (velocidad +20%)
  - Tamaño aumenta 1.5x
- **Coste**: 150 energía

**Código aproximado:**
```javascript
if (charIndex === 0 && isCombo_RRX) {
    player.transformed = true;
    player.transformTimer = this.time.now + 3000;
    
    // Mostrar sprite de transformación
    sprite.setTexture('char0_trans');
    sprite.setScale(1.5);
    
    // Modificar daño
    player.punchDamage = 45;  // Normal sería 30
    sprite.setTint(0xff6600);  // Color naranja = transformado
}
```

#### Combo 2: EXPLOSIÓN (L + R + X)
- **Entrada**: L presionado + R presionado + Golpe (X)
- **Efecto**: Charles genera una explosión alrededor suyo
- **Radio**: 200 píxeles alrededor del sprite
- **Daño**: 40 por impacto
- **Coste**: 120 energía
- **Duración**: 500ms (explosion stays visible)

**Código aproximado:**
```javascript
if (charIndex === 0 && isCombo_LRX) {
    player.explosionPending = true;
    player.explosionTimer = this.time.now + 500;
    
    // Crear explosión visual
    const explosion = this.add.sprite(sprite.x, sprite.y, 'charles_explosion');
    explosion.anims.play('charles_explosion_anim');
    explosion.destroy();  // Se destruye tras animación
    
    // Detectar overlaps con enemigos
    this.physics.add.overlap(
        explosion,
        this.players[1 - playerIndex],
        () => {
            this.applyDamageToPlayer(1 - playerIndex, 40);
        }
    );
}
```

### 2. SOFÍA (pj2) - La Tiradora de Energía

**Personaje:** Sofía es rápida y ágil, especializada en disparos de energía.

**Habilidades especiales:**

#### Combo 1: LÁSER DE ENERGÍA (L + L + X)
- **Entrada**: L presionado dos veces + Golpe (X)
- **Efecto**: Dispara un rayo de energía que atraviesa
- **Velocidad**: 600 píxels/segundo (más rápido que bala normal)
- **Daño**: 50 (el doble que disparo normal)
- **Piercing**: SÍ (atraviesa y no desaparece en primer impacto)
- **Coste**: 180 energía

**Código aproximado:**
```javascript
if (charIndex === 1 && isCombo_LLX) {
    const laser = this.projectiles.create(sprite.x, sprite.y);
    laser.setTexture('sofia_laser');
    laser.setVelocity(
        (target.x - sprite.x).normalize() * 600,
        (target.y - sprite.y).normalize() * 600
    );
    laser.damage = 50;
    laser.piercing = true;  // No se destruye en primer impacto
}
```

#### Combo 2: TELETRANSPORTE (R + R + X)
- **Entrada**: R presionado dos veces + Golpe (X)
- **Efecto**: Sofía se teletransporta a la ubicación del enemigo y ataca
- **Daño**: 35 (al llegar)
- **Duración**: Instantáneo
- **Coste**: 150 energía
- **Efecto visual**: Partículas azules en salida y llegada

**Código aproximado:**
```javascript
if (charIndex === 1 && isCombo_RRX) {
    const oldX = sprite.x, oldY = sprite.y;
    const target = this.players[1 - playerIndex];
    
    // Partículas de salida
    this.add.particles(0x0099ff).emitParticleAt(oldX, oldY);
    
    // Teletransportar
    sprite.setPosition(target.sprite.x - 50, target.sprite.y);
    
    // Partículas de llegada
    this.add.particles(0x0099ff).emitParticleAt(sprite.x, sprite.y);
    
    // Aplicar daño
    this.applyDamageToPlayer(1 - playerIndex, 35);
    
    // Stun corto
    target.beingHit = true;
    target.hitTimer = this.time.now + 300;
}
```

#### Combo 3: LLUVIA DE METEORITOS (L + R + B)
- **Entrada**: L presionado + R presionado + Disparar (B)
- **Efecto**: Invoca meteoritos que caen en área del enemigo
- **Cantidad**: 5-7 meteoritos
- **Daño cada uno**: 25
- **Área de efecto**: 150 píxeles de radio
- **Coste**: 200 energía

### 3. FRANCHESCA (pj3) - La Mecánica Robótica

**Personaje**: Franchesca es híbrida (tecnológica), especializada en ataques de energía robótica.

**Habilidades especiales:**

#### Combo 1: ROBO DE HABILIDAD (L + L + X)
- **Entrada**: L presionado dos veces + Golpe (X)
- **Efecto**: **ROBA** la última habilidad especial usada por el enemigo
- **Duración**: 8 segundos (puede usar la habilidad del enemigo)
- **Coste**: 100 energía
- **Límite**: Solo puede tener 1 habilidad robada activa

**Código aproximado:**
```javascript
if (charIndex === 3 && isCombo_LLX) {
    const enemy = this.players[1 - playerIndex];
    
    // Obtener la última habilidad usada del enemigo
    const stolenAbility = enemy.lastAbilityUsed;  // ej: "laser"
    
    if (stolenAbility) {
        player.stolenAbilities[stolenAbility] = true;
        player.stolenAbilitiesTimers[stolenAbility] = this.time.now + 8000;
        
        sprite.setTint(0xff00ff);  // Purple = habilidad robada
        this.cameras.main.flash(200, 255, 0, 255);  // Flash magenta
        
        console.log(`Franchesca robó: ${stolenAbility}`);
    }
}
```

**Cómo usar la habilidad robada:**

```javascript
// Después de robar, Franchesca puede usar la habilidad
// Presionando: L + L + X nuevamente

if (player.stolenAbilities['laser']) {
    // Puedo usar laser
}

// O se expira automáticamente tras 8 segundos
if (this.time.now > player.stolenAbilitiesTimers['laser']) {
    delete player.stolenAbilities['laser'];
    sprite.clearTint();  // Volver al color normal
}
```

#### Combo 2: SALTO MEJORADO (R + L + X)
- **Entrada**: R presionado + L presionado + Golpe (X)
- **Efecto**: Salto que deja "eco" de daño
- **Altura**: 2x más alto que salto normal
- **Duración de salto**: 600ms
- **Daño del eco**: 20
- **Coste**: 80 energía

#### Combo 3: GOLPE ÁREA (L + R + X)
- **Entrada**: L presionado + R presionado + Golpe (X)
- **Efecto**: Ataque en área de 180 grados frontal
- **Alcance**: 150 píxeles
- **Daño**: 45
- **Coste**: 140 energía

### 4. MARIO (pj4) - El Mago de Agua y Fuego

**Personaje**: Mario es versátil con ataques de elementos.

**Habilidades especiales:**

#### Combo 1: BOLA DE AGUA (R + R + X)
- **Entrada**: R presionado dos veces + Golpe (X)
- **Efecto**: Dispara una esfera de agua que rebota
- **Velocidad**: 500 píxels/segundo
- **Daño**: 35
- **Rebotes**: Rebota 3 veces antes de desaparecer
- **Coste**: 120 energía
- **Efecto especial**: Si golpea 2+ veces a mismo enemigo en 2 segundos, congela por 1 segundo

**Código aproximado:**
```javascript
if (charIndex === 3 && isCombo_RRX) {
    const waterBall = this.projectiles.create(sprite.x, sprite.y);
    waterBall.setTexture('mario_bola_agua');
    waterBall.anims.play('mario_bola_agua_fall');
    
    waterBall.velocity = new Phaser.Math.Vector2(
        (target.x - sprite.x).normalize() * 500,
        (target.y - sprite.y).normalize() * 500
    );
    
    waterBall.damage = 35;
    waterBall.bounces = 3;
    waterBall.hitCount = 0;
    waterBall.lastHitTime = 0;
    
    // Detector de rebote
    waterBall.bounce = () => {
        if (waterBall.bounces > 0) {
            waterBall.setVelocity(-waterBall.velocity.x, waterBall.velocity.y);
            waterBall.bounces--;
        } else {
            waterBall.destroy();
        }
    };
}
```

#### Combo 2: LÁSER DE SANGRE (L + R + X)
- **Entrada**: L presionado + R presionado + Golpe (X)
- **Efecto**: Rayo de energía oscura que hace daño continuo
- **Duración**: 2 segundos (se mantiene visible)
- **Daño por frame**: 5 (total 600 daño si está en rayo 2 segundos)
- **Ancho**: 40 píxeles
- **Coste**: 200 energía (costo continuo mientras activo)

**Código aproximado:**
```javascript
if (charIndex === 3 && isCombo_LRX) {
    player.laserActive = true;
    player.laserEnd = this.time.now + 2000;
    
    const laser = this.add.graphics();
    laser.fillStyle(0xff0000, 0.6);
    laser.fillRect(sprite.x, sprite.y - 20, 400, 40);
    
    // Daño continuo
    this.time.addEvent({
        delay: 16,  // Cada frame
        repeat: 124,  // 2 segundos @ 60 FPS
        callback: () => {
            if (this.players[1 - playerIndex].sprite.overlap(laser)) {
                this.applyDamageToPlayer(1 - playerIndex, 5);
            }
        }
    });
}
```

#### Combo 3: TORMENTA DE AGUA (R + L + B)
- **Entrada**: R presionado + L presionado + Disparar (B)
- **Efecto**: Múltiples proyectiles de agua en patrón
- **Cantidad**: 7 proyectiles en abanico
- **Daño cada uno**: 20
- **Coste**: 180 energía

---

## TABLA RESUMEN DE COMBOS

| Personaje | Combo | Entrada | Efecto | Daño | Coste |
|-----------|-------|---------|--------|------|-------|
| **CHARLES** | Transformación | R + R + X | +50% daño, +20% velocidad, tamaño 1.5x por 3s | N/A | 150 |
| | Explosión | L + R + X | Explosión 200px radio | 40 | 120 |
| **SOFÍA** | Láser | L + L + X | Rayo rápido, piercing | 50 | 180 |
| | Teletransporte | R + R + X | Teletransporta al enemigo + golpe | 35 | 150 |
| | Lluvia Meteoritos | L + R + B | 5-7 meteoritos en área | 25 c/u | 200 |
| **FRANCHESCA** | Robo Habilidad | L + L + X | Roba última habilidad por 8s | N/A | 100 |
| | Salto Mejorado | R + L + X | Salto 2x + eco de daño | 20 | 80 |
| | Golpe Área | L + R + X | Ataque frontal 180° | 45 | 140 |
| **MARIO** | Bola Agua | R + R + X | Bola que rebota 3x, congela si 2+ hits | 35 | 120 |
| | Láser Sangre | L + R + X | Rayo continuo 2s | 5/frame | 200 |
| | Tormenta Agua | R + L + B | 7 proyectiles abanico | 20 c/u | 180 |

---

## Ejemplo Completo: Cómo Jugar con CHARLES

```
ESCENARIO: Charles (pj1) vs Sofia (pj2) en Versus

t=0s: Batalla comienza
      Charles: HP=1000, Energy=500, Sofia: HP=1000, Energy=500

t=1s: Presionas R (carga buffer con 'R')
t=1.5s: Presionas R nuevamente (buffer = ['R', 'R'])
t=2s: Presionas X (golpe)
      ↓ COMBO DETECTADO: R + R + X = TRANSFORMACIÓN ✨
      
      Charles se TRANSFORMA:
      - Sprite crece a 1.5x
      - Color naranja
      - Daño de golpes: 30 → 45 (+50%)
      - Velocidad: 220 → 264 (+20%)
      - Timer: 3 segundos
      - Energía: 500 → 350 (-150)

t=2.5s: Presionas X (golpe durante transformación)
        Golpe hace 45 daño (vs normal 30)
        Sofia: HP = 1000 - 45 = 955

t=5s: Transformación termina
      Charles vuelve a normal
      - Tamaño: 1.0x
      - Daño: 30
      - Velocidad: 220
      - Color: blanco
```

---

## Resumen de todas las Mecánicas

| Mecánica | Función | Input | Requerimiento |
|----------|---------|-------|-----------------|
| **Bloqueo** | Reduce daño pero pierde HP pasivo | C/L | Distancia < 140px |
| **Carga** | Acumula energía para disparo fuerte | C/L presionado | Distancia > 140px |
| **Golpe** | Ataque cuerpo a cuerpo | X/K | Cooldown 350ms |
| **Disparo Normal** | Proyectil básico | B/P | 100 energía, cooldown 400ms |
| **Disparo Cargado** (coop) | Ambos cargan + ambos disparan | Ambos presionan botón | Energía > 0, distancia > 140px |
| **Combo Especial** | Habilidad única del personaje | Secuencia de botones | Energía requerida |


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