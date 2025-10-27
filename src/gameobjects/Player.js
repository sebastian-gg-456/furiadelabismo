import { GameObjects, Physics } from "phaser";
import { Bullet } from "./Bullet";

export class Player extends Physics.Arcade.Image {
    
    // Player states: waiting, start, can_move
    state = "waiting";
    scene = null;
    bullets = null;

    constructor({scene}) {
        super(scene, -190, 100, "player");
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);

    // NOTE: propulsion sprite/animation removed. Add your own visual asset later if needed.

        // Bullets group to create pool
        this.bullets = this.scene.physics.add.group({
            classType: Bullet,
            maxSize: 100,
            runChildUpdate: true
        });
    }

    start() {
        this.state = "start";
        // Effect to move the player from left to right
        this.scene.tweens.add({
            targets: this,
            x: 200,
            duration: 800,
            delay: 1000,
            ease: "Power2",
            yoyo: false,
            onUpdate: () => {
                // Trail FX removed. If you want a custom trail, add it here.
            },
            onComplete: () => {
                // When all tween are finished, the player can move
                this.state = "can_move";
            }
        });
    }

    move(direction) {
        if(this.state === "can_move") {
            if (direction === "up" && this.y - 10 > 0) {
                this.y -= 5;
                this.updatePropulsionFire();
            } else if (direction === "down" && this.y + 75 < this.scene.scale.height) {
                this.y += 5;
                this.updatePropulsionFire();
            }
        }
    }

    fire(x, y) {
        if (this.state === "can_move") {
            // Create bullet
            const bullet = this.bullets.get();
            if (bullet) {
                bullet.fire(this.x + 16, this.y + 5, x, y);
            }
        }
    }

    updatePropulsionFire() {
        // removed propulsion logic; keep stub so callers don't break
        return;
    }

    update() {
        // Sinusoidal movement up and down up and down 2px
        this.y += Math.sin(this.scene.time.now / 200) * 0.10;
        // propulsion visual removed
    }

}