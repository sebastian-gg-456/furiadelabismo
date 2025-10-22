# Estructura del Proyecto - La Furia del Abismo

## Resumen de la Refactorización

El archivo monolítico `game.js` ha sido dividido en módulos individuales para mejorar la organización y mantenibilidad del código.

## Estructura de Archivos

```
src/
├── globals.js                    # Variables globales (isEnglish)
├── utils.js                      # Funciones utilitarias (getPad)
├── main.js                       # Punto de entrada principal del juego
└── scenes/                       # Escenas del juego
    ├── Preloader.js              # Carga de assets
    ├── Menu.js                   # Menú principal
    ├── ControlsScene.js          # Pantalla de controles
    ├── ModeSelector.js           # Selección de modo (versus/cooperativo)
    ├── CharacterSelector.js      # Selección de personajes
    ├── MapSelector.js            # Selección de mapa
    ├── GameScene.js              # Escena principal del juego
    └── GameOver.js               # Pantalla de game over
```

## Archivos Principales

### `src/globals.js`
- **Propósito**: Contiene la variable global `isEnglish` que controla el idioma del juego
- **Exporta**: 
  - `globals` (objeto)
  - `isEnglish` (getter)
  - `setIsEnglish` (setter)

### `src/utils.js`
- **Propósito**: Funciones utilitarias compartidas
- **Exporta**: 
  - `getPad(idx, scene)` - Obtiene el gamepad de forma segura

### `src/main.js`
- **Propósito**: Punto de entrada del juego, configura Phaser
- **Importa**: Todas las escenas del juego
- **Configura**: 
  - Física arcade con gravedad
  - Soporte para gamepad
  - Sistema de escalado responsive

## Escenas del Juego

### 1. Preloader
- Carga todos los assets (sprites, imágenes, audio)
- Crea animaciones para los 4 personajes
- Transición automática al menú principal

### 2. Menu
- Menú principal con opciones:
  - JUGAR
  - IDIOMA (toggle español/inglés)
  - CONTROLES

### 3. ControlsScene
- Muestra los controles del juego
- Lista de habilidades especiales de cada personaje

### 4. ModeSelector
- Selección entre modo VERSUS y CO-OP

### 5. CharacterSelector
- Selección de personajes para ambos jugadores
- 4 personajes disponibles: Charles, Sofia, Franchesca, Mario
- Confirmación dual (ambos jugadores deben confirmar)

### 6. MapSelector
- Selección de mapa para la partida
- 3 mapas disponibles

### 7. GameScene
- Escena principal del juego
- Sistema completo de combate
- Habilidades especiales por personaje
- Sistema de robo de habilidades (Franchesca)
- Manejo de físicas y colisiones

### 8. GameOver
- Pantalla final con opciones:
  - REINICIAR (misma configuración)
  - SELECCIONAR PERSONAJE
  - VOLVER AL MENÚ

## Sistema de Imports/Exports

Todos los archivos utilizan módulos ES6:
- `export default` para las clases de escena
- `export` para utilidades y variables globales
- `import` para dependencias

## Cambios Importantes

1. **Variable Global isEnglish**: 
   - Movida de scope global a módulo `globals.js`
   - Accesible mediante `globals.isEnglish`

2. **Función getPad**: 
   - Extraída a `utils.js`
   - Importada donde se necesite

3. **Módulos ES6**: 
   - `index.html` carga `main.js` como módulo (`type="module"`)
   - Todas las escenas son exportadas e importadas correctamente