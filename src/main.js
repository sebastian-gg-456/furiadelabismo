// main.js
// Archivo principal del juego

// Importar escenas
import Preloader from './scenes/Preloader.js';
import Menu from './scenes/Menu.js';
import ControlsScene from './scenes/ControlsScene.js';
import ModeSelector from './scenes/ModeSelector.js';
import CharacterSelector from './scenes/CharacterSelector.js';
import MapSelector from './scenes/MapSelector.js';
import GameScene from './scenes/GameScene.js';
import GameOver from './scenes/GameOver.js';

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
    scene: [Preloader, Menu, ControlsScene, ModeSelector, CharacterSelector, MapSelector, GameScene, GameOver]
};

// Inicializar el juego
const game = new Phaser.Game(gameConfig);
