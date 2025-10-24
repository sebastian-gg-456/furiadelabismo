// CharacterSelector.js
// ESCENA CHARACTER SELECTOR

export default class CharacterSelector extends Phaser.Scene {
    constructor() { super("CharacterSelector"); }
    init(data) { this.selectedMode = data.mode || "versus"; }

    create() {
        const { width, height } = this.scale;
        try {
            if (this.scale && this.scale.isFullscreen) this.scale.stopFullscreen();
        } catch (e) { /* ignore */ }
        try {
            const doc = window.document;
            if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
                if (doc.exitFullscreen) doc.exitFullscreen();
                else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
                else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
                else if (doc.msExitFullscreen) doc.msExitFullscreen();
            }
        } catch (e) { /* ignore */ }
        this.cameras.main.setBackgroundColor(0x001d33);

        this.characters = [
            { name: "Charles", color: 0x006699 },
            { name: "Sofia", color: 0x0099cc },
            { name: "Franchesca", color: 0x660066 },
            { name: "Mario", color: 0x33cccc }
        ];

        this.playerSelections = [{ index: 0 }, { index: this.characters.length - 1 }];
        this.characterRects = [];

        const rectWidth = 200, rectHeight = 300, spacing = 40;
        const totalWidth = this.characters.length * rectWidth + (this.characters.length - 1) * spacing;
        let startX = (width - totalWidth) / 2 + rectWidth / 2;
        const centerY = height / 2;

        this.characters.forEach((char, i) => {
            const box = this.add.rectangle(startX, centerY, rectWidth, rectHeight, char.color).setStrokeStyle(2, 0x000000).setInteractive();
            const spriteKey = `char${i}_idle`;
            let preview = null;
            if (this.textures.exists(spriteKey)) {
                preview = this.add.sprite(startX, centerY - 20, spriteKey);
                preview.setDisplaySize(64, 64);
                if (this.anims.exists(spriteKey)) {
                    try { preview.setFrame(0); } catch (e) { /* ignore if frame setting fails */ }
                }
            } else {
                preview = this.add.rectangle(startX, centerY - 20, rectWidth - 40, rectHeight - 120, char.color).setStrokeStyle(1, 0x000000);
            }
            this.add.text(startX, centerY + rectHeight / 2 + 25, char.name, { font: "22px Arial", color: "#00ffff" }).setOrigin(0.5);
            box.on('pointerdown', (ptr) => {
                this.playerSelections[0].index = i;
                this.unconfirmSelection(0);
                this.updateSelectors();
            });
            this.characterRects.push(box);
            box.preview = preview;
            startX += rectWidth + spacing;
        });

        this.playerSelectors = [
            this.add.rectangle(this.characterRects[this.playerSelections[0].index].x, centerY, rectWidth + 12, rectHeight + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5),
            this.add.rectangle(this.characterRects[this.playerSelections[1].index].x, centerY, rectWidth + 12, rectHeight + 12).setStrokeStyle(4, 0xffaa00).setOrigin(0.5)
        ];

        this.confirmed = [false, false];

        this.keyLeftP1 = this.input.keyboard.addKey('A');
        this.keyRightP1 = this.input.keyboard.addKey('D');
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');

        this.keyLeftP2 = this.input.keyboard.addKey('LEFT');
        this.keyRightP2 = this.input.keyboard.addKey('RIGHT');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');

        this.input.gamepad.on('connected', pad => {
            pad._leftPressed = pad._rightPressed = false;
            pad._aPressed = pad._bPressed = false;
        });

        this.updateSelectors();
    }

    confirmSelection(idx) {
        this.confirmed[idx] = true;
        if (this.playerSelectors[idx]) this.playerSelectors[idx].setStrokeStyle(4, 0x00ff00);
        if (this.confirmed[0] && this.confirmed[1]) {
            this.scene.start("MapSelector", {
                player1: this.playerSelections[0].index,
                player2: this.playerSelections[1].index,
                mode: this.selectedMode
            });
        }
    }
    unconfirmSelection(idx) {
        this.confirmed[idx] = false;
        if (this.playerSelectors[idx]) {
            const color = (idx === 0) ? 0xffff00 : 0xffaa00;
            this.playerSelectors[idx].setStrokeStyle(4, color);
        }
    }

    update() {
        const pads = this.input.gamepad.gamepads;

        if (Phaser.Input.Keyboard.JustDown(this.keyLeftP1)) { this.playerSelections[0].index = Phaser.Math.Wrap(this.playerSelections[0].index - 1, 0, this.characterRects.length); this.unconfirmSelection(0); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyRightP1)) { this.playerSelections[0].index = Phaser.Math.Wrap(this.playerSelections[0].index + 1, 0, this.characterRects.length); this.unconfirmSelection(0); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyLeftP2)) { this.playerSelections[1].index = Phaser.Math.Wrap(this.playerSelections[1].index - 1, 0, this.characterRects.length); this.unconfirmSelection(1); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyRightP2)) { this.playerSelections[1].index = Phaser.Math.Wrap(this.playerSelections[1].index + 1, 0, this.characterRects.length); this.unconfirmSelection(1); this.updateSelectors(); }

        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1)) this.confirmSelection(0);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.confirmSelection(1);

        if (Phaser.Input.Keyboard.JustDown(this.keyBackP1)) {
            if (this.confirmed[0]) this.unconfirmSelection(0);
            else this.scene.start("ModeSelector");
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP2)) {
            if (this.confirmed[1]) this.unconfirmSelection(1);
            else this.scene.start("ModeSelector");
        }

        pads.forEach((pad, i) => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            const sel = this.playerSelections[i] || this.playerSelections[0];

            if (x < -0.55 && !pad._leftPressed) { sel.index = Phaser.Math.Wrap(sel.index - 1, 0, this.characterRects.length); pad._leftPressed = true; this.unconfirmSelection(i); this.updateSelectors(); }
            else if (x > 0.55 && !pad._rightPressed) { sel.index = Phaser.Math.Wrap(sel.index + 1, 0, this.characterRects.length); pad._rightPressed = true; this.unconfirmSelection(i); this.updateSelectors(); }
            else if (x > -0.55 && x < 0.55) pad._leftPressed = pad._rightPressed = false;

            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) {
                this.confirmSelection(i);
                pad._aPressed = true;
            }
            if (!a) pad._aPressed = false;

            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) {
                if (this.confirmed[i]) this.unconfirmSelection(i);
                else this.scene.start("ModeSelector");
                pad._bPressed = true;
            }
            if (!b) pad._bPressed = false;
        });
    }

    updateSelectors() {
        if (this.playerSelectors && this.characterRects) {
            if (this.playerSelectors[0] && this.characterRects[this.playerSelections[0].index]) {
                this.playerSelectors[0].x = this.characterRects[this.playerSelections[0].index].x;
            }
            if (this.playerSelectors[1] && this.characterRects[this.playerSelections[1].index]) {
                this.playerSelectors[1].x = this.characterRects[this.playerSelections[1].index].x;
            }
        }
    }
}
