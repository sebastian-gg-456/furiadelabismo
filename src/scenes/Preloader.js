// Preloader.js
// ESCENA PRELOADER

export default class Preloader extends Phaser.Scene {
    constructor() { super("Preloader"); }
    preload() {
        // Carga de assets para personajes (4 repos)
        this.load.setPath('assets/player');

        const mapping = {
            repo1: {
                walk: 'repo1/caminar-derecha.png', idle: 'repo1/mirar-derecha.png', shoot: 'repo1/disparo-derecha.png',
                punch: 'repo1/golpe-derecha.png', punch_fire: 'repo1/golpe-fuego-derecha.png', kick: 'repo1/patada-derecha.png',
                block: 'repo1/bloqueo-derecha.png', charge: 'repo1/carga-energia-derecha.png',
                hurt: 'repo1/caminar-herido-derecha.png', jump: 'repo1/salto-derecha.png'
            },
            repo2: {
                walk: 'repo2/caminar2-derecha.png', idle: 'repo2/mirar2-derecha.png', shoot: 'repo2/disparo2-derecha.png',
                punch: 'repo2/golpe2-derecha.png', block: 'repo2/bloqueo2-derecha.png', charge: 'repo2/carga-energia2-derecha.png',
                hurt: 'repo2/caminar2-herido-derecha.png', jump: 'repo2/salto2-derecha1.png'
            },
            repo3: {
                walk: 'repo3/caminar3-derecha.png', idle: 'repo3/mirar3-derecha.png', shoot: 'repo3/disparo3-derecha.png',
                punch: 'repo3/golpe3-derecha.png', robo: 'repo3/robo3-derecha.png', block: 'repo3/bloqueo3-derecha.png', charge: 'repo3/carga3-energia-derecha.png',
                hurt: 'repo3/caminar3-herido-derecha.png', jump: 'repo3/salto3-derecha.png'
            },
            repo4: {
                walk: 'repo4/caminar4-derecha.png', idle: 'repo4/mirar4-derecha.png', shoot: 'repo4/disparo4-derecha.png',
                block: 'repo4/bloqueo4-derecha.png', charge: 'repo4/carga4-energia-derecha.png',
                hurt: 'repo4/caminar4-herido-derecha.png', jump: 'repo4/salto4-derecha.png'
            }
        };

        // Cargar todos los assets de personajes como spritesheet de 64x64.
        Object.keys(mapping).forEach((repoKey, idx) => {
            const charIndex = idx;
            const m = mapping[repoKey];
            for (const action in m) {
                const key = `char${charIndex}_${action}`;
                this.load.spritesheet(key, m[action], { frameWidth: 64, frameHeight: 64 });
            }
        });
        this._mapping = mapping;

    this._map1Retry = false;
    this.load.image('map1', 'mapas/mapa1.png');
    this.load.on('loaderror', (file) => {
        try {
            if (file && file.key === 'map1' && !this._map1Retry) {
                console.warn('map1 failed to load (relative), retrying with absolute path');
                this._map1Retry = true;
                this.load.image('map1', '/mapas/mapa1.png');
                this.load.start();
            }
        } catch (e) { /* ignore */ }
    }, this);

        // Otros assets
        this.load.setPath('assets');
        this.load.image('floor', 'floor.png');
        this.load.setPath('assets/player');
        this.load.image('bullet', 'bullet.png');
        this.load.image('tex_bullet', 'bullet.png');
    }

    
    create() {
        this.createAnimations();
        this.scene.start('Menu');
    }

    createAnimations() {
        for (let i = 0; i < 4; i++) {
            const actions = ['walk', 'idle', 'shoot', 'punch', 'block', 'charge', 'hurt', 'jump','punch_fire','kick','robo'];
            actions.forEach(act => {
                const key = `char${i}_${act}`;
                if (!this.textures.exists(key)) return;
                const tex = this.textures.get(key);
                let frames = [{ key }];

                let desiredCount = 2;
                if (act === 'punch' || act === 'punch_fire' || act === 'kick') desiredCount = 3;
                if (act === 'robo') desiredCount = 2;

                try {
                    if (desiredCount > 1 && this.textures.exists(key) && tex.frameTotal && tex.frameTotal > 1) {
                        const maxAvailable = Math.max(0, tex.frameTotal - 1);
                        const endFrame = Math.min(maxAvailable, Math.max(0, desiredCount - 1));
                        frames = this.anims.generateFrameNumbers(key, { start: 0, end: endFrame });
                    } else {
                        frames = [{ key, frame: 0 }];
                    }
                } catch (e) {
                    frames = [{ key, frame: 0 }];
                }

                let frameRate = 12;
                if (act === 'walk') frameRate = 6;
                else if (act === 'idle') frameRate = 6;
                else if (act === 'punch' || act === 'shoot' || act === 'punch_fire' || act === 'kick') frameRate = 4;

                const repeat = (act === 'punch' || act === 'shoot' || act === 'jump' || act === 'punch_fire' || act === 'kick' || act === 'robo') ? 0 : -1;

                this.anims.create({ key: `${key}`, frames: frames, frameRate: frameRate, repeat: repeat });
                try {
                    const total = tex && tex.frameTotal ? tex.frameTotal : (tex && tex.frames ? Object.keys(tex.frames).length : 1);
                    const usedFrames = Array.isArray(frames) ? frames.length : 0;
                    console.log(`ANIM CREATED: ${key} desired=${desiredCount} available=${total} used=${usedFrames} fr=${frameRate} rep=${repeat}`);
                } catch (e) { /* ignore logging errors */ }
            });
        }
    }
}
