// main.js

// Configuración principal de Phaser
const BASE_WIDTH = 1024;
const BASE_HEIGHT = 768;

const gameConfig = {
    type: Phaser.AUTO,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
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
        mode: Phaser.Scale.FIT,
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [LoginScene, Preloader, Menu, ControlsScene, ModeSelector, CharacterSelector, MapSelector, GameScene, VictoryScene, GameOver]
};

// Inicializar el juego
const game = new Phaser.Game(gameConfig);
