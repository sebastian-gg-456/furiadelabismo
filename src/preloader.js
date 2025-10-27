// Class to preload all the assets
// Remember you can load this assets in another scene if you need it
export class Preloader extends Phaser.Scene {
    constructor() {
        super({ key: "Preloader" });
    }

    preload() {
        // Load all the assets
        this.load.setPath("assets");
        this.load.image("logo", "logo.png");
        this.load.image("floor");
        this.load.image("background", "background.png");

        this.load.image("player", "player/player.png");
    // --- CARGA DE SPRITES DE SOFIA (pj2) ---
    // Rutas relativas a la carpeta 'assets' (setPath arriba)
    this.load.spritesheet('caminar', 'player/pj2/pj2-caminar.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('disparo', 'player/pj2/pj2-disparo.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('golpe', 'player/pj2/PJ2-golpe.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('bala', 'player/pj2/pj2-bala.png', { frameWidth: 64, frameHeight: 64 });
    // Si quieres agregar más personajes, sigue el mismo patrón.

        // Bullets
        this.load.image("bullet", "player/bullet.png");
        this.load.image("flares")

        // Enemies
    // enemy atlas/animation loading removed (add your own enemy assets as needed)
        this.load.image("enemy-bullet", "enemies/enemy-bullet.png");

        // Fonts
        this.load.bitmapFont("pixelfont", "fonts/pixelfont.png", "fonts/pixelfont.xml");
        this.load.image("knighthawks", "fonts/knight3.png");

        // Event to update the loading bar
        this.load.on("progress", (progress) => {
            console.log("Loading: " + Math.round(progress * 100) + "%");
        });
    }

    create() {
        // Create bitmap font and load it in cache
        const config = {
            image: 'knighthawks',
            width: 31,
            height: 25,
            chars: Phaser.GameObjects.RetroFont.TEXT_SET6,
            charsPerRow: 10,
            spacing: { x: 1, y: 1 }
        };
        this.cache.bitmapFont.add('knighthawks', Phaser.GameObjects.RetroFont.Parse(this, config));

        // When all the assets are loaded go to the next scene
        // ---------- CREACIÓN DE ANIMACIONES (Sofía / pj2) ----------
        try {
            // Caminar en loop
            this.anims.create({
                key: 'caminar',
                frames: this.anims.generateFrameNumbers('caminar', { start: 0, end: 1 }),
                frameRate: 5,
                repeat: -1
            });

            // Disparo (solo una vez)
            this.anims.create({
                key: 'disparo',
                frames: this.anims.generateFrameNumbers('disparo', { start: 0, end: 5 }),
                frameRate: 5,
                repeat: 0
            });

            // Golpe (solo una vez)
            this.anims.create({
                key: 'golpe',
                frames: this.anims.generateFrameNumbers('golpe', { start: 0, end: 5 }),
                frameRate: 5,
                repeat: 0
            });

            // Impacto de bala
            this.anims.create({
                key: 'bala_impact',
                frames: this.anims.generateFrameNumbers('bala', { start: 1, end: 4 }),
                frameRate: 5,
                repeat: 0
            });
        } catch (e) { /* ignore if assets missing or frames invalid */ }

        // Cuando quieras pasar a la siguiente escena
        this.scene.start("SplashScene");
    }
}