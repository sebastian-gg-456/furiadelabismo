// main.js

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
    scene: [Preloader, Menu, ControlsScene, ModeSelector, CharacterSelector, MapSelector, GameScene, VictoryScene, GameOver]
};

// Inicializar el juego
const game = new Phaser.Game(gameConfig);
