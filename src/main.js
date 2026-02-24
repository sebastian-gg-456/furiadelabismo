// main.js (module entrypoint)
// Inject Google Client ID from Vite env into window before game starts
// Set VITE_GOOGLE_CLIENT_ID in .env (development) or in Vercel env vars (build time)
window.GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || null;
if (!window.GOOGLE_CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID not set. Google Sign-In will not work until you set it.');
}

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
