// main.js (module entrypoint)
// Import core scene classes from game.js (ES module)
import { LoginScene, Preloader, Menu, ControlsScene, ModeSelector, CharacterSelector, MapSelector, GameScene, VictoryScene, GameOver } from '../game.js';

// Configuración principal de Phaser
const gameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    input: {
        gamepad: true
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [LoginScene, Preloader, Menu, ModeSelector, CharacterSelector, MapSelector, GameScene, ControlsScene, GameOver] // <-- LoginScene ahora es la primera
};

// Inicializar el juego
const game = new Phaser.Game(gameConfig);
