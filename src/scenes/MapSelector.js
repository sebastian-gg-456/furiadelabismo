// MapSelector.js
// ESCENA MAP SELECTOR

import { globals } from '../globals.js';

export default class MapSelector extends Phaser.Scene {
    constructor() { super("MapSelector"); }
    init(data) {
        this.player1Index = data.player1;
        this.player2Index = data.player2;
        this.selectedMode = data.mode;
        this.currentMap = 0;
        this.maps = ["Mapa 1", "Mapa 2", "Mapa 3"];
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x001933);
        this.title = this.add.text(width / 2, 80, globals.isEnglish ? "Select a Map" : "Selecciona un Mapa", { font: "48px Arial", color: "#00ffff" }).setOrigin(0.5);
        this.mapText = this.add.text(width / 2, height / 2, this.maps[this.currentMap], { font: "36px Arial", color: "#66ffff" }).setOrigin(0.5);

        this.prev = this.add.text(width / 2 - 200, height / 2, "<", { font: "64px Arial", color: "#00ffff" }).setInteractive();
        this.next = this.add.text(width / 2 + 200, height / 2, ">", { font: "64px Arial", color: "#00ffff" }).setInteractive();

        this.startButton = this.add.rectangle(width / 2, height / 2 + 150, 200, 70, 0x004466).setInteractive();
        this.startText = this.add.text(width / 2, height / 2 + 150, globals.isEnglish ? "START" : "EMPEZAR", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);

        this.prev.on('pointerdown', () => this.changeMap(-1));
        this.next.on('pointerdown', () => this.changeMap(1));
        this.startButton.on('pointerdown', () => this.startGame());

        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');

        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');
        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyLeft2)) this.changeMap(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyRight2)) this.changeMap(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.startGame();
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP1) || Phaser.Input.Keyboard.JustDown(this.keyBackP2)) this.scene.start("CharacterSelector", { mode: this.selectedMode });

        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (x < -0.6 && !pad._leftPressed) { this.changeMap(-1); pad._leftPressed = true; }
            else if (x > 0.6 && !pad._rightPressed) { this.changeMap(1); pad._rightPressed = true; }
            else if (x > -0.6 && x < 0.6) pad._leftPressed = pad._rightPressed = false;

            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) { this.startGame(); pad._aPressed = true; }
            if (!a) pad._aPressed = false;

            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) { this.scene.start("CharacterSelector", { mode: this.selectedMode }); pad._bPressed = true; }
            if (!b) pad._bPressed = false;
        });
    }

    changeMap(dir) {
        this.currentMap = Phaser.Math.Wrap(this.currentMap + dir, 0, this.maps.length);
        this.mapText.setText(this.maps[this.currentMap]);
    }

    startGame() {
        this.scene.start("GameScene", { player1Index: this.player1Index, player2Index: this.player2Index, mode: this.selectedMode, map: this.maps[this.currentMap] });
    }
}
