import { Scene } from "phaser";
import { Player } from "../gameobjects/Player";
import { BlueEnemy } from "../gameobjects/BlueEnemy";

export class MainScene extends Scene {
    player = null;
    enemy_blue = null;
    cursors = null;

    points = 0;
    game_over_timeout = 20;

    constructor() {
        super("MainScene");
    }

    init() {
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        this.scene.launch("MenuScene");

        // Reset points
        this.points = 0;
        this.game_over_timeout = 20;
    }

    create() {
        this.add.image(0, 0, "background")
            .setOrigin(0, 0);
        this.add.image(0, this.scale.height, "floor").setOrigin(0, 1);

        // Player
        this.player = new Player({ scene: this });

        // Enemy
        this.enemy_blue = new BlueEnemy(this);

        // Cursor keys 
        this.cursors = this.input && this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
        // Attach keyboard space handler defensively
        if (this.cursors && this.cursors.space && typeof this.cursors.space.on === 'function') {
            this.cursors.space.on("down", () => {
                try { if (this.player && typeof this.player.fire === 'function') this.player.fire(); } catch (e) { console.warn('Error calling player.fire():', e); }
            });
        }
        // Pointer handler (defensive)
        if (this.input && typeof this.input.on === 'function') {
            this.input.on("pointerdown", (pointer) => {
                try { if (this.player && typeof this.player.fire === 'function') this.player.fire(pointer.x, pointer.y); } catch (e) { console.warn('Error calling player.fire(pointer):', e); }
            });
        }

        // Overlap enemy with bullets
        this.physics.add.overlap(this.player.bullets, this.enemy_blue, (enemy, bullet) => {
            bullet.destroyBullet();
            this.enemy_blue.damage(this.player.x, this.player.y);
            this.points += 10;
            this.scene.get("HudScene")
                .update_points(this.points);
        });

        // Overlap player with enemy bullets
        this.physics.add.overlap(this.enemy_blue.bullets, this.player, (player, bullet) => {
            bullet.destroyBullet();
            this.cameras.main.shake(100, 0.01);
            // Flash the color white for 300ms
            this.cameras.main.flash(300, 255, 10, 10, false,);
            this.points -= 10;
            this.scene.get("HudScene")
                .update_points(this.points);
        });

        // This event comes from MenuScene
        this.game.events.on("start-game", () => {
            this.scene.stop("MenuScene");
            this.scene.launch("HudScene", { remaining_time: this.game_over_timeout });
            this.player.start();
            this.enemy_blue.start();

            // Game Over timeout
            this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {
                    if (this.game_over_timeout === 0) {
                        // You need remove the event listener to avoid duplicate events.
                        // Use 'off' to remove listeners (Safer than removeListener with anonymous functions)
                        if (this.game && this.game.events && this.game.events.off) {
                            this.game.events.off("start-game");
                        }
                        // It is necessary to stop the scenes launched in parallel.
                        this.scene.stop("HudScene");
                        this.scene.start("GameOverScene", { points: this.points });
                    } else {
                        this.game_over_timeout--;
                        this.scene.get("HudScene").update_timeout(this.game_over_timeout);
                    }
                }
            });
        });
    }

    update() {
        this.player.update();
        this.enemy_blue.update();

        // Player movement entries (defensive checks)
        if (this.cursors && this.cursors.up && this.cursors.up.isDown) {
            try { if (this.player && typeof this.player.move === 'function') this.player.move("up"); } catch (e) { console.warn('Error in player.move("up"):', e); }
        }
        if (this.cursors && this.cursors.down && this.cursors.down.isDown) {
            try { if (this.player && typeof this.player.move === 'function') this.player.move("down"); } catch (e) { console.warn('Error in player.move("down"):', e); }
        }

    }
}