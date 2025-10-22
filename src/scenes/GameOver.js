// GameOver.js
// ESCENA GAME OVER

import { globals } from '../globals.js';

export default class GameOver extends Phaser.Scene {
    constructor() { super('GameOver'); }
    init(data) {
        this.winnerIndex = data.winnerIndex ?? 0;
        this.winnerChar = data.winnerChar ?? 0;
        this.player1Index = data.player1Index ?? 0;
        this.player2Index = data.player2Index ?? 1;
        this.mode = data.mode || 'versus';
    }
    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x001d33);
        const winnerName = this.winnerIndex === 0 ? (['Charles','Sofia','Franchesca','Mario'][this.player1Index] || 'Player 1') : (['Charles','Sofia','Franchesca','Mario'][this.player2Index] || 'Player 2');
    this.add.text(width/2, 120, 'FIN DEL JUEGO', { font: '64px Arial', color: '#ff4444' }).setOrigin(0.5);
    this.add.text(width/2, 200, `${winnerName} ganó!`, { font: '36px Arial', color: '#ffffff' }).setOrigin(0.5);

        // Buttons
        const buttonW = 260, buttonH = 64, spacing = 30;
        const bx = width/2;
        let by = height - 160;

        this.buttons = [];

        const restartBtn = this.add.rectangle(bx - (buttonW + spacing), by, buttonW, buttonH, 0x004466).setInteractive();
        const restartTxt = this.add.text(restartBtn.x, restartBtn.y, globals.isEnglish ? 'RESTART' : 'REINICIAR', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: restartBtn, txt: restartTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('GameOver');
            this.scene.start('GameScene', { player1Index: this.player1Index, player2Index: this.player2Index, mode: this.mode, map: 'Mapa 1' });
        }});

        const charSelBtn = this.add.rectangle(bx, by, buttonW, buttonH, 0x003355).setInteractive();
        const charSelTxt = this.add.text(charSelBtn.x, charSelBtn.y, globals.isEnglish ? 'CHAR SELECT' : 'SELECCIONAR PERSONAJE', { font: '18px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: charSelBtn, txt: charSelTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('GameOver');
            this.scene.start('CharacterSelector', { mode: this.mode });
        }});

        const menuBtn = this.add.rectangle(bx + (buttonW + spacing), by, buttonW, buttonH, 0x002244).setInteractive();
        const menuTxt = this.add.text(menuBtn.x, menuBtn.y, globals.isEnglish ? 'MENU' : 'MENU', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: menuBtn, txt: menuTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('GameOver');
            this.scene.start('Menu');
        }});

        this.selector = this.add.rectangle(this.buttons[0].rect.x, this.buttons[0].rect.y, buttonW + 12, buttonH + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5);
        this.selectedIndex = 0;

        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        this.input.gamepad.on('connected', pad => { pad._leftPressed = pad._rightPressed = pad._aPressed = false; });

        this.buttons.forEach((b, idx) => { b.rect.on('pointerdown', () => { this.buttons[idx].callback(); }); });
    }
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyLeft2)) this.moveSelector(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyRight2)) this.moveSelector(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.selectCurrent();

        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (x < -0.6 && !pad._leftPressed) { this.moveSelector(-1); pad._leftPressed = true; }
            else if (x > 0.6 && !pad._rightPressed) { this.moveSelector(1); pad._rightPressed = true; }
            else if (x > -0.6 && x < 0.6) { pad._leftPressed = pad._rightPressed = false; }

            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) { this.selectCurrent(); pad._aPressed = true; }
            if (!a) pad._aPressed = false;
        });
    }
    moveSelector(dir) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const b = this.buttons[this.selectedIndex].rect;
        if (b) { this.selector.x = b.x; this.selector.y = b.y; }
    }
    selectCurrent() { if (this.buttons && this.buttons[this.selectedIndex]) this.buttons[this.selectedIndex].callback(); }
}
