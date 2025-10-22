// ControlsScene.js
// ESCENA CONTROLES

import { globals } from '../globals.js';

export default class ControlsScene extends Phaser.Scene {
    constructor() { super("ControlsScene"); }
    create() {
        const { width, height } = this.scale;
    this._gameOverCooldownUntil = 0;
        this._bgYOffset = 48;
        if (this._bgOffsetText) { try { this._bgOffsetText.setText(`bg offset: ${this._bgYOffset}`); } catch (e) {} }
        if (this._bgImage && this._bgImage.scene) {
            try { this._bgImage.destroy(); } catch (e) {}
            this._bgImage = null;
        }
        this.cameras.main.setBackgroundColor(0x001d33);

        const title = this.add.text(40, 40, globals.isEnglish ? "CONTROLS (GAMEPAD)" : "CONTROLES (MANDO)", { font: "36px Arial", color: "#00ffff" }).setOrigin(0, 0);

        let y = 100;
        const leftX = 40;
        const line = (txt) => {
            this.add.text(leftX, y, txt, { font: "22px Arial", color: "#ffffff", align: 'left' }).setOrigin(0, 0);
            y += 32;
        };

        line(globals.isEnglish ? "Move: Left stick (horizontal)" : "Mover: palanca izquierda (horizontal)");
        line(globals.isEnglish ? "Jump: Push left stick UP" : "Saltar: empujar palanca izquierda HACIA ARRIBA");
        line(globals.isEnglish ? "Punch: X button" : "Golpe: botón X");
        line(globals.isEnglish ? "Block/Charge: A button" : "Bloquear/Cargar: botón A");
        line(globals.isEnglish ? "Shoot: B button" : "Disparar: botón B");
        y += 10;

    line(globals.isEnglish ? "Franchesca special (examples):" : "Franchesca - instrucciones especiales:");
    line(globals.isEnglish ? "Right, Right + Punch = Steal" : "Derecha, Derecha + Golpe = Robo (robar habilidad)");
    line(globals.isEnglish ? "Left, Left + Punch = Use stolen ability" : "Izquierda, Izquierda + Golpe = Usar habilidad robada");
    y += 8;

    line(globals.isEnglish ? "Charles - Abilities:" : "Charles - Habilidades:");
    line(globals.isEnglish ? "1) Left, Right + Punch: Quick dash hit" : "1) Izq, Der + Golpe: Embestida rápida");
    line(globals.isEnglish ? "2) Right, Left + Punch: Shield burst" : "2) Der, Izq + Golpe: Explosión de escudo");
    line(globals.isEnglish ? "3) Right, Right + Punch: Ground slam" : "3) Der, Der + Golpe: Golpe al suelo");
    y += 6;

    line(globals.isEnglish ? "Sofia - Abilities:" : "Sofia - Habilidades:");
    line(globals.isEnglish ? "1) Left, Right + Punch: Swift shot" : "1) Izq, Der + Golpe: Disparo veloz");
    line(globals.isEnglish ? "2) Right, Left + Punch: Energy bubble" : "2) Der, Izq + Golpe: Burbuja energética");
    line(globals.isEnglish ? "3) Right, Right + Punch: Aerial flip" : "3) Der, Der + Golpe: Voltereta aérea");
    y += 6;

    line(globals.isEnglish ? "Franchesca - Abilities:" : "Franchesca - Habilidades:");
    line(globals.isEnglish ? "1) Left, Right + Punch: Steal minor item" : "1) Izq, Der + Golpe: Robar ítem menor");
    line(globals.isEnglish ? "2) Right, Left + Punch: Quick vanish" : "2) Der, Izq + Golpe: Desvanecimiento rápido");
    line(globals.isEnglish ? "3) Right, Right + Punch: Steal major ability" : "3) Der, Der + Golpe: Robar habilidad mayor");
    y += 6;

    line(globals.isEnglish ? "Mario - Abilities:" : "Mario - Habilidades:");
    line(globals.isEnglish ? "1) Left, Right + Punch: Fire dash" : "1) Izq, Der + Golpe: Carrera de fuego");
    line(globals.isEnglish ? "2) Right, Left + Punch: Power throw" : "2) Der, Izq + Golpe: Lanzamiento potente");
    line(globals.isEnglish ? "3) Right, Right + Punch: Spin upper" : "3) Der, Der + Golpe: Giro ascendente");
    y += 12;

        const backBtn = this.add.rectangle(width / 2, height - 70, 220, 60, 0x003355).setInteractive();
        const backTxt = this.add.text(width / 2, height - 70, globals.isEnglish ? "BACK" : "VOLVER", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        backBtn.on('pointerdown', () => this.scene.start("Menu"));

        this.input.keyboard.on('keydown-ESC', () => this.scene.start("Menu"));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start("Menu"));
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start("Menu"));
    }
}
