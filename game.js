// game.js
// ========================
// --- SISTEMA DE SESIONES Y LOGIN ---
// ========================

// Gestión de sesiones con localStorage
const SessionManager = {
    // Obtener todas las sesiones guardadas
    getAllSessions() {
        const sessions = localStorage.getItem('gameSessions');
        return sessions ? JSON.parse(sessions) : {};
    },

    // Crear una nueva sesión
    createSession(username, character, difficulty) {
        const sessions = this.getAllSessions();
        const sessionId = username + '_' + Date.now();
        
        sessions[sessionId] = {
            id: sessionId,
            username: username,
            character: character,
            difficulty: difficulty,
            createdAt: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            sessionStartTime: Date.now(), // Inicio de la sesión actual
            totalPlayTime: 0, // Tiempo total de juego acumulado (ms)
            progress: {
                level: 1,
                score: 0,
                coins: 0,
                enemies_defeated: 0
            }
        };
        
        localStorage.setItem('gameSessions', JSON.stringify(sessions));
        localStorage.setItem('currentSession', sessionId);
        return sessions[sessionId];
    },

    // Cargar una sesión existente
    loadSession(sessionId) {
        const sessions = this.getAllSessions();
        if (sessions[sessionId]) {
            sessions[sessionId].lastPlayed = new Date().toISOString();
            sessions[sessionId].sessionStartTime = Date.now(); // Reiniciar tiempo actual
            localStorage.setItem('gameSessions', JSON.stringify(sessions));
            localStorage.setItem('currentSession', sessionId);
            return sessions[sessionId];
        }
        return null;
    },

    // Obtener la sesión actual
    getCurrentSession() {
        const currentSessionId = localStorage.getItem('currentSession');
        if (currentSessionId) {
            return this.getAllSessions()[currentSessionId] || null;
        }
        return null;
    },

    // Eliminar una sesión
    deleteSession(sessionId) {
        const sessions = this.getAllSessions();
        delete sessions[sessionId];
        localStorage.setItem('gameSessions', JSON.stringify(sessions));
        if (localStorage.getItem('currentSession') === sessionId) {
            localStorage.removeItem('currentSession');
        }
    },

    // Actualizar progreso de sesión actual
    updateSessionProgress(progressData) {
        const currentSessionId = localStorage.getItem('currentSession');
        if (currentSessionId) {
            const sessions = this.getAllSessions();
            if (sessions[currentSessionId]) {
                sessions[currentSessionId].progress = {
                    ...sessions[currentSessionId].progress,
                    ...progressData
                };
                localStorage.setItem('gameSessions', JSON.stringify(sessions));
            }
        }
    },

    // Finalizar sesión y guardar tiempo de juego
    endSession() {
        const currentSessionId = localStorage.getItem('currentSession');
        if (currentSessionId) {
            const sessions = this.getAllSessions();
            if (sessions[currentSessionId]) {
                const sessionStartTime = sessions[currentSessionId].sessionStartTime || Date.now();
                const timeElapsed = Date.now() - sessionStartTime;
                sessions[currentSessionId].totalPlayTime += timeElapsed;
                sessions[currentSessionId].sessionStartTime = null;
                localStorage.setItem('gameSessions', JSON.stringify(sessions));
            }
        }
    },

    // Obtener tiempo jugado en la sesión actual (en minutos)
    getCurrentSessionPlayTime() {
        const currentSessionId = localStorage.getItem('currentSession');
        if (currentSessionId) {
            const sessions = this.getAllSessions();
            if (sessions[currentSessionId]) {
                const startTime = sessions[currentSessionId].sessionStartTime;
                const totalTime = sessions[currentSessionId].totalPlayTime || 0;
                if (startTime) {
                    return Math.floor((totalTime + (Date.now() - startTime)) / 1000 / 60); // minutos
                }
                return Math.floor(totalTime / 1000 / 60);
            }
        }
        return 0;
    }
};

// ========================
// --- VARIABLES GLOBALES ---
// ========================
let isEnglish = false;
let currentPlayer = null; // Sesión del jugador actual

// Utility: safe get pad
function getPad(idx, scene) {
    const pads = scene.input.gamepad.gamepads;
    if (!pads || !pads.length) return null;
    return pads[idx] || null;
}

// Patch global para prevenir errores de removeAllListeners
if (typeof Phaser !== 'undefined' && Phaser.GameObjects && Phaser.GameObjects.GameObject) {
    const originalRemoveAllListeners = Phaser.GameObjects.GameObject.prototype.removeAllListeners;
    Phaser.GameObjects.GameObject.prototype.removeAllListeners = function(event) {
        try {
            if (this.scene && originalRemoveAllListeners) {
                return originalRemoveAllListeners.call(this, event);
            }
        } catch (e) {
            // Ignorar silenciosamente
        }
        return this;
    };
}

// ========================
// --- ESCENAS ---
// ========================

// --- ESCENA LOGIN ---
export class LoginScene extends Phaser.Scene {
    constructor() { 
        super("Login");
        this.selectedIndex = 0;
        this.buttons = [];
        this.currentMode = 'login'; // 'login' o 'create'
        this.gamepadIndex = 0;
        this.lastGamepadInput = 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        // Fondo de menú (si existe el asset fondo-menu.webp en public/mapas)
        try { ensureMenuBackground(this); } catch (e) {}
        // Fallback: si no cargó la imagen, mantener rectángulo simple
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
        
        // Título
        this.add.text(width / 2, 80, 'FURIA DE LA ABISMO', {
            font: 'bold 48px Arial',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 140, 'Sistema de Sesiones', {
            font: '24px Arial',
            fill: '#00ff00'
        }).setOrigin(0.5);

        // Obtener sesiones existentes
        const sessions = SessionManager.getAllSessions();
        const sessionsList = Object.values(sessions);

        // Si hay sesiones guardadas, mostrar opción de cargarlas
        if (sessionsList.length > 0) {
            this.add.text(width / 2, 200, 'Sesiones Guardadas:', {
                font: 'bold 20px Arial',
                fill: '#ffff00'
            }).setOrigin(0.5);

            let yPos = 250;
            let buttonIndex = 0;
            sessionsList.forEach((session, index) => {
                const playTime = Math.floor((session.totalPlayTime || 0) / 1000 / 60); // minutos
                const sessionText = `${session.username} - Lvl ${session.progress.level} (${session.character}) - ${playTime}m`;
                const button = this.add.text(width / 2, yPos, sessionText, {
                    font: '18px Arial',
                    fill: '#00ff00',
                    backgroundColor: '#0a0a1a',
                    padding: { x: 20, y: 10 }
                })
                    .setOrigin(0.5)
                    .setInteractive()
                    .on('pointerover', () => {
                        this.selectedIndex = buttonIndex;
                        this.updateButtonSelection();
                    })
                    .on('pointerdown', () => {
                        SessionManager.loadSession(session.id);
                        currentPlayer = session;
                        this.scene.start('Preloader');
                    });

                this.buttons.push({
                    text: button,
                    type: 'session',
                    sessionId: session.id
                });
                buttonIndex++;
                yPos += 60;
            });

            // Botón para nueva sesión
            const newSessionButton = this.add.text(width / 2, yPos + 40, '+ NUEVA SESIÓN', {
                font: 'bold 18px Arial',
                fill: '#ffffff',
                backgroundColor: '#0066ff',
                padding: { x: 30, y: 15 }
            })
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover', () => {
                    this.selectedIndex = buttonIndex;
                    this.updateButtonSelection();
                })
                .on('pointerdown', () => this.showCreateSessionForm());

            this.buttons.push({
                text: newSessionButton,
                type: 'new'
            });

            this.currentMode = 'login';
            this.updateButtonSelection();
        } else {
            // Si no hay sesiones, mostrar formulario directo
            this.add.text(width / 2, 220, 'No hay sesiones guardadas', {
                font: '18px Arial',
                fill: '#ff9999'
            }).setOrigin(0.5);

            this.showCreateSessionForm();
        }

        // Configurar input de joystick
        this.input.gamepad.on('connected', (pad) => {
            this.gamepadIndex = pad.index;
        });
    }

    update() {
        if (this.currentMode !== 'login') return;

        const pad = this.input.gamepad.gamepads[this.gamepadIndex];
        if (!pad) return;

        const now = Date.now();
        if (now - this.lastGamepadInput < 200) return; // Debounce

        // Navegar con D-Pad o Analog Stick
        const dpadUp = pad.buttons[12].pressed;
        const dpadDown = pad.buttons[13].pressed;
        const leftStickUp = pad.axes[1].value < -0.5;
        const leftStickDown = pad.axes[1].value > 0.5;

        if (dpadUp || leftStickUp) {
            this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
            this.lastGamepadInput = now;
            this.updateButtonSelection();
        } else if (dpadDown || leftStickDown) {
            this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
            this.lastGamepadInput = now;
            this.updateButtonSelection();
        }

        // Seleccionar con A button (0) o Start (9)
        if (pad.buttons[0].pressed || pad.buttons[9].pressed) {
            this.lastGamepadInput = now;
            const button = this.buttons[this.selectedIndex];
            if (button.type === 'session') {
                SessionManager.loadSession(button.sessionId);
                currentPlayer = SessionManager.getCurrentSession();
                this.scene.start('Preloader');
            } else if (button.type === 'new') {
                this.showCreateSessionForm();
            }
        }
    }

    updateButtonSelection() {
        this.buttons.forEach((btn, index) => {
            if (index === this.selectedIndex) {
                btn.text.setFill('#ff0000');
                btn.text.setBackgroundColor('#ff00ff');
            } else {
                if (btn.type === 'session') {
                    btn.text.setFill('#00ff00');
                    btn.text.setBackgroundColor('#0a0a1a');
                } else {
                    btn.text.setFill('#ffffff');
                    btn.text.setBackgroundColor('#0066ff');
                }
            }
        });
    }

    showCreateSessionForm() {
        const { width, height } = this.cameras.main;
        this.currentMode = 'create';

        // Limpiar botones anteriores
        this.buttons = [];
        this.children.list.forEach(child => {
            if (child !== this.children.list[0] && child !== this.children.list[1]) {
                child.destroy();
            }
        });

        this.add.text(width / 2, 200, 'Crear Nueva Sesión', {
            font: 'bold 20px Arial',
            fill: '#ffff00'
        }).setOrigin(0.5);

        // Campo de nombre de usuario
        const userInput = document.createElement('input');
        userInput.type = 'text';
        userInput.placeholder = 'Nombre de usuario';
        userInput.style.cssText = `
            position: absolute;
            left: ${width / 2 - 100}px;
            top: 300px;
            width: 200px;
            padding: 10px;
            font-size: 16px;
            background: #1a1a2e;
            color: #00ff00;
            border: 2px solid #00ff00;
            border-radius: 5px;
            z-index: 100;
        `;
        document.body.appendChild(userInput);
        userInput.focus();

        // Personajes con nombres reales
        const characters = ['Charles', 'Sofía', 'Vex', 'Nova'];
        let selectedCharIndex = 0;
        const charButtons = [];

        this.add.text(width / 2 - 100, 380, 'Personaje:', {
            font: '14px Arial',
            fill: '#ffffff'
        });

        let charYPos = 410;
        characters.forEach((char, idx) => {
            const button = this.add.text(width / 2 - 50, charYPos, char, {
                font: '12px Arial',
                fill: idx === selectedCharIndex ? '#ff0000' : '#00ff00',
                backgroundColor: idx === selectedCharIndex ? '#ff00ff' : '#0a0a1a',
                padding: { x: 10, y: 5 }
            })
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', () => {
                    selectedCharIndex = idx;
                    charButtons.forEach((btn, i) => {
                        if (i === idx) {
                            btn.setFill('#ff0000');
                            btn.setBackgroundColor('#ff00ff');
                        } else {
                            btn.setFill('#00ff00');
                            btn.setBackgroundColor('#0a0a1a');
                        }
                    });
                });
            charButtons.push(button);
            charYPos += 35;
        });

        // Selector de dificultad
        this.add.text(width / 2 - 100, 540, 'Dificultad:', {
            font: '14px Arial',
            fill: '#ffffff'
        });

        const difficulties = ['Fácil', 'Medio', 'Difícil'];
        let selectedDiffIndex = 0;
        const diffButtons = [];

        let diffYPos = 570;
        difficulties.forEach((diff, idx) => {
            const button = this.add.text(width / 2 - 50, diffYPos, diff, {
                font: '12px Arial',
                fill: idx === selectedDiffIndex ? '#ff0000' : '#00ff00',
                backgroundColor: idx === selectedDiffIndex ? '#ff00ff' : '#0a0a1a',
                padding: { x: 10, y: 5 }
            })
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', () => {
                    selectedDiffIndex = idx;
                    diffButtons.forEach((btn, i) => {
                        if (i === idx) {
                            btn.setFill('#ff0000');
                            btn.setBackgroundColor('#ff00ff');
                        } else {
                            btn.setFill('#00ff00');
                            btn.setBackgroundColor('#0a0a1a');
                        }
                    });
                });
            diffButtons.push(button);
            diffYPos += 35;
        });

        // Botón para crear sesión
        const startButton = this.add.text(width / 2, height - 100, 'COMENZAR JUEGO', {
            font: 'bold 18px Arial',
            fill: '#ffffff',
            backgroundColor: '#00ff00',
            padding: { x: 30, y: 15 }
        })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', function() { this.setFill('#000000'); })
            .on('pointerout', function() { this.setFill('#ffffff'); })
            .on('pointerdown', () => {
                const username = userInput.value || 'Jugador' + Math.floor(Math.random() * 10000);
                
                // Crear la sesión
                const session = SessionManager.createSession(username, characters[selectedCharIndex], difficulties[selectedDiffIndex]);
                currentPlayer = session;
                
                // Limpiar input
                if (userInput.parentNode) {
                    userInput.parentNode.removeChild(userInput);
                }
                
                this.scene.start('Preloader');
            });

        // Instrucciones de joystick
        this.add.text(width / 2, 30, '↑/↓ para navegar • A para seleccionar', {
            font: '12px Arial',
            fill: '#00ffff'
        }).setOrigin(0.5);
    }
}

// Global error hooks to capture stack traces for runtime errors (helps trace undefined removeAllListeners)
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        try {
            console.warn('Global error caught:', e.message, e.filename + ':' + e.lineno + ':' + e.colno);
            if (e.error && e.error.stack) console.warn(e.error.stack);
        } catch (ex) { /* ignore */ }
    });
    window.addEventListener('unhandledrejection', (ev) => {
        try { console.warn('Unhandled promise rejection:', ev.reason && ev.reason.stack ? ev.reason.stack : ev.reason); } catch (ex) { }
    });
}

// Helper global: reproducir música de menú en bucle en escenas de menú
function ensureMenuMusic(scene) {
    try {
        const game = scene.game;
        if (!game) return;
        // Si ya existe y fue destruida, limpiar referencia
        if (game.menuMusic && game.menuMusic.isDestroyed) game.menuMusic = null;
        if (!game.menuMusic && scene.sound && scene.sound.add) {
            try {
                game.menuMusic = scene.sound.add('menu_music', { loop: true, volume: 0.5 });
            } catch (e) {
                game.menuMusic = null;
            }
        }
        // Intentar reproducir vía WebAudio
        let webAudioStarted = false;
        if (game.menuMusic && !game.menuMusic.isPlaying) {
            try { game.menuMusic.play(); webAudioStarted = true; } catch (e) { webAudioStarted = false; }
        } else if (game.menuMusic && game.menuMusic.isPlaying) {
            webAudioStarted = true;
        }

        // Fallback: usar HTMLAudio si WebAudio falla o no se cargó/decodificó
        if (!webAudioStarted) {
            if (!game.menuMusicTag) {
                try {
                    const tag = new Audio('/assets/musica-menu.mp3');
                    tag.loop = true;
                    tag.volume = 0.5;
                    game.menuMusicTag = tag;
                } catch (e) { /* ignore */ }
            }
            const tag = game.menuMusicTag;
            if (tag && tag.paused) {
                // Requisitos de interacción del usuario pueden impedir auto-play; ignoramos error
                tag.play().catch(() => {});
            }
        }
    } catch (e) { /* ignore */ }
}

function stopMenuMusic(scene) {
    try {
        const game = scene.game;
        if (!game) return;
        // Detener WebAudio si existe
        if (game.menuMusic) {
            try { 
                if (game.menuMusic.isPlaying) {
                    game.menuMusic.stop(); 
                }
                // No destruir - solo detener y establecer en null para que se recree después
                game.menuMusic = null;
            } catch (e) { /* ignore */ }
        }
        // Detener HTMLAudio si existe
        if (game.menuMusicTag) {
            try { 
                game.menuMusicTag.pause(); 
                game.menuMusicTag.currentTime = 0;
                game.menuMusicTag = null;
            } catch (e) { /* ignore */ }
        }
    } catch (e) { /* ignore */ }
}

// Helper global: reproducir música de batalla (versus/coop) en bucle
function ensureBattleMusic(scene) {
    try {
        const game = scene.game;
        if (!game) return;
        // Si ya existe y fue destruida, limpiar referencia
        if (game.battleMusic && game.battleMusic.isDestroyed) game.battleMusic = null;
        if (!game.battleMusic && scene.sound && scene.sound.add) {
            try {
                game.battleMusic = scene.sound.add('battle_music', { loop: true, volume: 0.5 });
            } catch (e) {
                game.battleMusic = null;
            }
        }
        // Intentar reproducir vía WebAudio
        let webAudioStarted = false;
        if (game.battleMusic && !game.battleMusic.isPlaying) {
            try { game.battleMusic.play(); webAudioStarted = true; } catch (e) { webAudioStarted = false; }
        } else if (game.battleMusic && game.battleMusic.isPlaying) {
            webAudioStarted = true;
        }

        // Fallback: usar HTMLAudio si WebAudio falla o no se cargó/decodificó
        if (!webAudioStarted) {
            if (!game.battleMusicTag) {
                try {
                    const tag = new Audio('/assets/musica-pelea.mp3');
                    tag.loop = true;
                    tag.volume = 0.5;
                    game.battleMusicTag = tag;
                } catch (e) { /* ignore */ }
            }
            const tag = game.battleMusicTag;
            if (tag && tag.paused) {
                tag.play().catch(() => {});
            }
        }
    } catch (e) { /* ignore */ }
}

function stopBattleMusic(scene) {
    try {
        const game = scene.game;
        if (!game) return;
        // Detener WebAudio si existe
        if (game.battleMusic) {
            try { 
                if (game.battleMusic.isPlaying) {
                    game.battleMusic.stop(); 
                }
                // No destruir - solo detener y establecer en null para que se recree después
                game.battleMusic = null;
            } catch (e) { /* ignore */ }
        }
        // Detener HTMLAudio si existe
        if (game.battleMusicTag) {
            try { 
                game.battleMusicTag.pause(); 
                game.battleMusicTag.currentTime = 0;
                game.battleMusicTag = null;
            } catch (e) { /* ignore */ }
        }
    } catch (e) { /* ignore */ }
}

// Helper: asegurar y mostrar fondo de menú (fondo-menu.webp en public/mapas)
function ensureMenuBackground(scene) {
    try {
        const key = 'fondo_menu';
        const relPath = 'mapas/fondo-menu.webp';
        const absPath = '/mapas/fondo-menu.webp';

        const addBg = function() {
            try {
                if (!scene || !scene.cameras) return;
                const camWidth = scene.cameras.main.width;
                const camHeight = scene.cameras.main.height;
                // destroy existing bg if present
                try { if (scene._bgImage && scene._bgImage.destroy) scene._bgImage.destroy(); } catch (e) {}
                const img = scene.add.image(camWidth / 2, camHeight / 2, key).setOrigin(0.5, 0.5).setDepth(-100);
                try { img.setDisplaySize(camWidth, camHeight); } catch (e) {}
                img.setScrollFactor(0);
                scene._bgImage = img;
                // resize handler
                try {
                    scene.scale.on('resize', (gs) => {
                        try {
                            if (scene._bgImage) scene._bgImage.setDisplaySize(gs.width, gs.height).setPosition(gs.width / 2, gs.height / 2);
                        } catch (e) {}
                    });
                } catch (e) {}
            } catch (e) { /* ignore */ }
        };

        if (scene.textures && scene.textures.exists && scene.textures.exists(key)) {
            addBg();
            return;
        }

        // One-time loader handlers
        scene.load.once('filecomplete-image-' + key, addBg, scene);
        scene.load.once('loaderror', (file) => {
            try {
                if (file && file.key === key && !scene._fondoMenuRetry) {
                    scene._fondoMenuRetry = true;
                    scene.load.image(key, absPath);
                    scene.load.start();
                }
            } catch (e) {}
        }, scene);

        // Start loading relative path first
        try {
            scene.load.image(key, relPath);
            scene.load.start();
        } catch (e) {
            try { scene.load.image(key, absPath); scene.load.start(); } catch (ee) {}
        }
    } catch (e) { /* ignore */ }
}

// --- ESCENA PRELOADER ---
export class Preloader extends Phaser.Scene {
    constructor() { super("Preloader"); }
    preload() {
        // Carga de assets para personajes (4 repos)
        this.load.setPath('assets/player');

        const mapping = {
            repo1: {
                // Charles (pj1) - reemplazos solicitados
                // idle: usar primer frame de pj1-golpe
                // walk: pj1-caminar (frames 0-3)
                // punch: pj1-golpe (frames 0-3)
                // punch_fire (combo que quema): pj1-skill1 (frames 0-6)
                walk: 'pj1/pj1-caminar.png', idle: 'pj1/pj1-golpe.png', shoot: 'repo1/disparo-derecha.png',
                punch: 'pj1/pj1-golpe.png', punch_fire: 'pj1/pj1-skill1.png', kick: 'repo1/patada-derecha.png',
                block: 'repo1/bloqueo-derecha.png', charge: 'repo1/carga-energia-derecha.png',
                hurt: 'repo1/caminar-herido-derecha.png', jump: 'repo1/salto-derecha.png'
            },
            repo2: {
                // Reemplazado: usamos un único spritesheet para Sofía (pj2/pj2-disparo.png)
                // para todas las acciones. Idle usará frame 0; shoot animará 1-5.
                walk: 'pj2/pj2-disparo.png', idle: 'pj2/pj2-disparo.png', shoot: 'pj2/pj2-disparo.png',
                punch: 'pj2/pj2-disparo.png', block: 'pj2/pj2-disparo.png', charge: 'pj2/pj2-disparo.png',
                hurt: 'pj2/pj2-disparo.png', jump: 'pj2/pj2-disparo.png'
            },
            repo3: {
                // Franchesca (pj3)
                // Caminar: pj3-caminar (0-3), Idle: usar SIEMPRE el frame 3 de pj3-caminar
                // Golpe: pj3-ataque2 (0-3)
                // Disparo: usar solo frame 2 de pj3-ataque2
                // Robo: usar también frame 2 de pj3-ataque2
                walk: 'pj3/pj3-caminar.png', idle: 'pj3/pj3-caminar.png', shoot: 'pj3/pj3-ataque2.png',
                punch: 'pj3/pj3-ataque2.png', robo: 'pj3/pj3-ataque2.png', block: 'repo3/bloqueo3-derecha.png', charge: 'repo3/carga3-energia-derecha.png',
                hurt: 'repo3/caminar3-herido-derecha.png', jump: 'repo3/salto3-derecha.png'
            },
            repo4: {
                // Mario (pj4) usará pj4-golpe.png: frame 0 = idle, frames 1-5 = punch
                walk: 'pj4/pj4-golpe.png', idle: 'pj4/pj4-golpe.png', shoot: 'pj4/pj4-golpe.png',
                punch: 'pj4/pj4-golpe.png', block: 'pj4/pj4-golpe.png', charge: 'pj4/pj4-golpe.png',
                hurt: 'pj4/pj4-golpe.png', jump: 'pj4/pj4-golpe.png'
            }
        };

        // Cargar todos los assets de personajes como spritesheet de 64x64.
        // El comportamiento esperado: la mayoría de acciones tendrán 2 frames (idle/move/shot),
        // y golpes/patadas tendrán 3 frames. Cargamos todo como spritesheet para simplificar.
        Object.keys(mapping).forEach((repoKey, idx) => {
            const charIndex = idx; // 0..3
            const m = mapping[repoKey];
            for (const action in m) {
                const key = `char${charIndex}_${action}`;
                this.load.spritesheet(key, m[action], { frameWidth: 64, frameHeight: 64 });
            }
        });
        // Guardar mapping para recargas posteriores
        this._mapping = mapping;

        // Cargar imagen del mapa 1 desde public/mapas (servida en la raíz)
        // Nota: coloca tu archivo en public/mapas/mapaprov.png
        // Intentamos la ruta relativa primero (mapas/mapaprov.png). Si falla, reintentamos con la ruta absoluta '/mapas/mapaprov.png'.
        this._map1Retry = false;
        this.load.image('map1', 'mapas/mapaprov.png');
        this.load.on('loaderror', (file) => {
            try {
                if (file && file.key === 'map1' && !this._map1Retry) {
                    console.warn('map1 failed to load (relative), retrying with absolute path');
                    this._map1Retry = true;
                    this.load.image('map1', '/mapas/mapaprov.png');
                    this.load.start();
                }
            } catch (e) { /* ignore */ }
        }, this);

        // Cargar mapa2 Tiled JSON y su tileset (antes de cambiar el path)
        this.load.tilemapTiledJSON('mapa2', 'mapas/mapa2.JSON');
        this.load.image('tileset_mapa2', 'mapas/Tileset.png');

        // Otros assets
        this.load.setPath('assets');
        // background.png no existe en este proyecto, omitimos para evitar errores
        // this.load.image('background', 'background.png');
        this.load.image('floor', 'floor.png');
        
        this.load.setPath('assets/player');
        
        // Música de menú (desde carpeta public). Usar ruta absoluta para Vite/servidor
        // Manejar errores de decodificación de audio (algunos navegadores no pueden decodificar MP3 via WebAudio)
        this.load.once('filecomplete-audio-menu_music', () => {
            // Audio cargado correctamente
        });
        this.load.once('filecomplete-audio-battle_music', () => {
            // Audio cargado correctamente
        });
        // Suprimir errores de decodificación - el fallback a HTMLAudio lo manejará
        const originalOnProcessError = this.load.onProcessError || function() {};
        this.load.onProcessError = function(file) {
            if (file && file.type === 'audio' && (file.key === 'menu_music' || file.key === 'battle_music')) {
                // Silenciar error de audio - usaremos HTMLAudio como fallback
                return;
            }
            originalOnProcessError.call(this, file);
        };
        
        try {
            this.load.audio('menu_music', '/assets/musica-menu.mp3');
            this.load.audio('battle_music', '/assets/musica-pelea.mp3');
        } catch (e) { /* ignore audio load errors */ }
        
        this.load.image('bullet', 'bullet.png');
        this.load.image('tex_bullet', 'bullet.png');
        // Charles normal shot projectile (spritesheet): frames 0-6 fly, 7-9 impact
        // Asumimos frames de 64x64 como el resto de sprites; ajustaremos si es necesario
        this.load.spritesheet('charles_bullet', 'pj1/bala-piedra.png', { frameWidth: 64, frameHeight: 64 });
        // Charles habilidad especial: explosión (frames 0-10)
        this.load.spritesheet('charles_explosion', 'pj1/explocion.png', { frameWidth: 64, frameHeight: 64 });
        // Charles transform spritesheet (usado para visual en transformación y golpe transformado)
        this.load.spritesheet('char0_trans', 'pj1/pj1-trans.png', { frameWidth: 64, frameHeight: 64 });
        // Sofia special (R,R + Punch) projectile sprite (spritesheet 64x64)
        this.load.spritesheet('sofia_piedra', 'pj2/piedra.png', { frameWidth: 64, frameHeight: 64 });
        // Sofia normal shot projectile (spritesheet 64x64): frame 0 = move, 1-5 = impact
        this.load.spritesheet('sofia_bullet', 'pj2/pj2-bala.png', { frameWidth: 64, frameHeight: 64 });
        // Sofia walk overlay (spritesheet 64x64): frames 0-2 para caminar
        this.load.spritesheet('sofia_walk', 'pj2/PJ2-golpe.png', { frameWidth: 64, frameHeight: 64 });
        // Sofia punch overlay usa el mismo spritesheet (frames 1-5 para golpe)
        this.load.spritesheet('sofia_punch', 'pj2/PJ2-golpe.png', { frameWidth: 64, frameHeight: 64 });
        // Sofia block/charge overlay (spritesheet 64x64): frame 0 = block, frames 0-1 = charge animation
        this.load.spritesheet('sofia_charge', 'pj2/carga2.png', { frameWidth: 64, frameHeight: 64 });
        // Mario (pj4) punch overlay (spritesheet 64x64): frame 0 = idle, frames 1-5 = punch
        this.load.spritesheet('mario_punch', 'pj4/pj4-golpe.png', { frameWidth: 64, frameHeight: 64 });
        // Mario walk overlay (spritesheet 64x64): frames 0-2 para caminar
        this.load.spritesheet('mario_walk', 'pj4/caminar4.png', { frameWidth: 64, frameHeight: 64 });
        // Mario block overlay (spritesheet 64x64): un solo frame para bloquear
        this.load.spritesheet('mario_block', 'pj4/pj4-bloquear.png', { frameWidth: 64, frameHeight: 64 });
        // Mario charge overlay (spritesheet 64x64): frames 0-1 para carga de energía
        this.load.spritesheet('mario_charge', 'pj4/carga.png', { frameWidth: 64, frameHeight: 64 });
        // Mario habilidad especial (R,L,X): agua (frames 0-12)
        this.load.spritesheet('mario_agua', 'pj4/agua.png', { frameWidth: 64, frameHeight: 64 });
        // Mario habilidad especial (R,R,X): bola de agua (frames 0-13)
        this.load.spritesheet('mario_bola_agua', 'pj4/bola-agua.png', { frameWidth: 64, frameHeight: 64 });
        // Mario habilidad especial (L,R,X): láser de sangre (frames 0-14, 104x64)
        this.load.spritesheet('mario_laser_sangre', 'pj4/laser-sangre.png', { frameWidth: 104, frameHeight: 64 });
        // Franchesca (pj3) - anim especial de ataque aéreo en área
        this.load.spritesheet('fran_air_aoe', 'pj3/pj3-golpe.png', { frameWidth: 64, frameHeight: 64 });
        
        // Enemigos
        this.load.setPath('assets/enemies');
        // Enemigo volador (spritesheet 64x64): frame 0 = idle, frames 0-1 = shoot animation
        this.load.spritesheet('flying_enemy', 'enemigo-ataque.png', { frameWidth: 64, frameHeight: 64 });
        // Enemigo terrestre (spritesheet 64x64): frames 0-5 para moverse
        this.load.spritesheet('ground_enemy_walk', 'moverce-enemigo2.png', { frameWidth: 64, frameHeight: 64 });
        // Enemigo terrestre (spritesheet 64x64): frames 0-5 para atacar/desviar
        this.load.spritesheet('ground_enemy_attack', 'ataque-enemigo2.png', { frameWidth: 64, frameHeight: 64 });
        // Boss (spritesheets 64x64): caminar (idle=0, mover=1-2), ataque AoE (0-3), muerte (0-1)
        this.load.spritesheet('boss_walk', 'jefe-caminar.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('boss_attack', 'ataque-jefe.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('boss_death', 'muerte-jefe.png', { frameWidth: 64, frameHeight: 64 });
        
        this.load.setPath('assets/player');
    }

    
    create() {
        // Las cargas ya se hicieron como spritesheet para acciones multi-frame.
        // Creamos las animaciones y continuamos al menú.
        this.createAnimations();
        // Animación para la piedra de Sofía (frames 0..7 en bucle)
        try {
            if (this.textures.exists('sofia_piedra') && !this.anims.exists('sofia_piedra_spin')) {
                const tex = this.textures.get('sofia_piedra');
                let totalFrames = 1;
                try {
                    if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                    else if (tex && tex.frames) totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                } catch (e) { totalFrames = 1; }
                const endFrame = Math.min(7, Math.max(0, totalFrames - 1));
                const frames = this.anims.generateFrameNumbers('sofia_piedra', { start: 0, end: endFrame });
                this.anims.create({ key: 'sofia_piedra_spin', frames, frameRate: 12, repeat: -1 });
            }
        } catch (e) { /* ignore piedra anim errors */ }
        // Animaciones de bala de Charles: vuelo (0-6) y golpe (7-9)
        try {
            if (this.textures.exists('charles_bullet')) {
                const tex = this.textures.get('charles_bullet');
                let totalFrames = 1;
                try {
                    if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                    else if (tex && tex.frames) totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                } catch (e) { totalFrames = 1; }
                const flyEnd = Math.min(6, Math.max(0, totalFrames - 1));
                const impactEnd = Math.max(0, totalFrames - 1);
                if (!this.anims.exists('charles_bullet_fly')) {
                    const flyFrames = this.anims.generateFrameNumbers('charles_bullet', { start: 0, end: flyEnd });
                    this.anims.create({ key: 'charles_bullet_fly', frames: flyFrames, frameRate: 16, repeat: -1 });
                }
                if (!this.anims.exists('charles_bullet_impact')) {
                    const startImpact = Math.min(7, impactEnd);
                    const endImpact = Math.min(9, impactEnd);
                    const impactFrames = this.anims.generateFrameNumbers('charles_bullet', { start: startImpact, end: endImpact });
                    this.anims.create({ key: 'charles_bullet_impact', frames: impactFrames, frameRate: 18, repeat: 0 });
                }
            }
            // Animaciones de bala de Sofía: vuelo (frame 0) e impacto (1-5)
            if (this.textures.exists('sofia_bullet')) {
                const texS = this.textures.get('sofia_bullet');
                let totalFramesS = 1;
                try {
                    if (texS && typeof texS.frameTotal === 'number') totalFramesS = Math.max(1, texS.frameTotal);
                    else if (texS && texS.frames) totalFramesS = Math.max(1, Object.keys(texS.frames).filter(k => !isNaN(+k)).length);
                } catch (e) { totalFramesS = 1; }
                const flyEndS = Math.min(0, Math.max(0, totalFramesS - 1)); // solo frame 0
                const impactEndS = Math.max(0, totalFramesS - 1);
                if (!this.anims.exists('sofia_bullet_fly')) {
                    const flyFramesS = this.anims.generateFrameNumbers('sofia_bullet', { start: 0, end: flyEndS });
                    this.anims.create({ key: 'sofia_bullet_fly', frames: flyFramesS, frameRate: 1, repeat: -1 });
                }
                if (!this.anims.exists('sofia_bullet_impact')) {
                    const startImpactS = Math.min(1, impactEndS);
                    const endImpactS = Math.min(5, impactEndS);
                    const impactFramesS = this.anims.generateFrameNumbers('sofia_bullet', { start: startImpactS, end: endImpactS });
                    this.anims.create({ key: 'sofia_bullet_impact', frames: impactFramesS, frameRate: 18, repeat: 0 });
                }
            }
            // Animación de explosión de Charles (frames 0-10, sin loop)
            if (this.textures.exists('charles_explosion') && !this.anims.exists('charles_explosion')) {
                const tex = this.textures.get('charles_explosion');
                let totalFrames = 1;
                try {
                    if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                    else if (tex && tex.frames) totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                } catch (e) { totalFrames = 1; }
                const endFrame = Math.min(10, Math.max(0, totalFrames - 1));
                const frames = this.anims.generateFrameNumbers('charles_explosion', { start: 0, end: endFrame });
                this.anims.create({ key: 'charles_explosion', frames, frameRate: 18, repeat: 0 });
            }
            // Animación de agua de Mario (frames 0-12, sin loop)
            if (this.textures.exists('mario_agua') && !this.anims.exists('mario_agua')) {
                const tex = this.textures.get('mario_agua');
                let totalFrames = 1;
                try {
                    if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                    else if (tex && tex.frames) totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                } catch (e) { totalFrames = 1; }
                const endFrame = Math.min(12, Math.max(0, totalFrames - 1));
                const frames = this.anims.generateFrameNumbers('mario_agua', { start: 0, end: endFrame });
                this.anims.create({ key: 'mario_agua', frames, frameRate: 20, repeat: 0 });
            }
            // Animación de bola de agua de Mario - caída (frames 0-6, loop) - para R,R,X
            if (this.textures.exists('mario_bola_agua') && !this.anims.exists('mario_bola_agua_fall')) {
                const tex = this.textures.get('mario_bola_agua');
                let totalFrames = 1;
                try {
                    if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                    else if (tex && tex.frames) totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                } catch (e) { totalFrames = 1; }
                const endFrame = Math.min(6, Math.max(0, totalFrames - 1));
                const frames = this.anims.generateFrameNumbers('mario_bola_agua', { start: 0, end: endFrame });
                this.anims.create({ key: 'mario_bola_agua_fall', frames, frameRate: 16, repeat: -1 });
            }
            // Animación de bola de agua de Mario - impacto (frames 7-13, sin loop) - para R,R,X
            if (this.textures.exists('mario_bola_agua') && !this.anims.exists('mario_bola_agua_impact')) {
                const tex = this.textures.get('mario_bola_agua');
                let totalFrames = 1;
                try {
                    if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                    else if (tex && tex.frames) totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                } catch (e) { totalFrames = 1; }
                const startFrame = Math.min(7, Math.max(0, totalFrames - 1));
                const endFrame = Math.min(13, Math.max(0, totalFrames - 1));
                const frames = this.anims.generateFrameNumbers('mario_bola_agua', { start: startFrame, end: endFrame });
                this.anims.create({ key: 'mario_bola_agua_impact', frames, frameRate: 20, repeat: 0 });
            }
            // Animación de láser de sangre de Mario - alargamiento (frames 0-14, sin loop) - para L,R,X
            if (this.textures.exists('mario_laser_sangre') && !this.anims.exists('mario_laser_sangre')) {
                const tex = this.textures.get('mario_laser_sangre');
                let totalFrames = 1;
                try {
                    if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                    else if (tex && tex.frames) totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                } catch (e) { totalFrames = 1; }
                const endFrame = Math.min(14, Math.max(0, totalFrames - 1));
                const frames = this.anims.generateFrameNumbers('mario_laser_sangre', { start: 0, end: endFrame });
                this.anims.create({ key: 'mario_laser_sangre', frames, frameRate: 18, repeat: 0 });
            }

            // Override específico para Sofía (repo2 / char1): disparo usa frames 1..5 de pj2-disparo
            try {
                if (this.textures.exists('char1_shoot')) {
                    if (this.anims.exists('char1_shoot')) {
                        this.anims.remove('char1_shoot');
                    }
                    const tex = this.textures.get('char1_shoot');
                    let totalFrames = 1;
                    try {
                        if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                        else if (tex && tex.frames) totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalFrames = 1; }
                    const endShoot = Math.min(5, Math.max(1, totalFrames - 1));
                    const framesSofia = this.anims.generateFrameNumbers('char1_shoot', { start: 1, end: endShoot });
                    // Más rápido como pediste: 1..5 a ~18 fps
                    this.anims.create({ key: 'char1_shoot', frames: framesSofia, frameRate: 18, repeat: 0 });
                }
                // Animación de caminar de Sofía (frames 0-2) con frameRate lento
                if (this.textures.exists('sofia_walk') && !this.anims.exists('sofia_walk')) {
                    const texWalk = this.textures.get('sofia_walk');
                    let totalWalk = 1;
                    try {
                        if (texWalk && typeof texWalk.frameTotal === 'number') totalWalk = Math.max(1, texWalk.frameTotal);
                        else if (texWalk && texWalk.frames) totalWalk = Math.max(1, Object.keys(texWalk.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalWalk = 1; }
                    const endWalk = Math.min(2, Math.max(0, totalWalk - 1));
                    const framesWalk = this.anims.generateFrameNumbers('sofia_walk', { start: 0, end: endWalk });
                    this.anims.create({ key: 'sofia_walk', frames: framesWalk, frameRate: 4, repeat: -1 });
                }
                // Animación de golpe de Sofía (frames 1-5) más rápida
                if (this.textures.exists('sofia_punch') && !this.anims.exists('sofia_punch')) {
                    const texPunch = this.textures.get('sofia_punch');
                    let totalPunch = 1;
                    try {
                        if (texPunch && typeof texPunch.frameTotal === 'number') totalPunch = Math.max(1, texPunch.frameTotal);
                        else if (texPunch && texPunch.frames) totalPunch = Math.max(1, Object.keys(texPunch.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalPunch = 1; }
                    const endPunch = Math.min(5, Math.max(1, totalPunch - 1));
                    const framesPunch = this.anims.generateFrameNumbers('sofia_punch', { start: 1, end: endPunch });
                    this.anims.create({ key: 'sofia_punch', frames: framesPunch, frameRate: 18, repeat: 0 });
                }
                // Animación de bloqueo de Sofía (solo frame 0, estático)
                if (this.textures.exists('sofia_charge') && !this.anims.exists('sofia_block')) {
                    const framesBlock = this.anims.generateFrameNumbers('sofia_charge', { start: 0, end: 0 });
                    this.anims.create({ key: 'sofia_block', frames: framesBlock, frameRate: 1, repeat: 0 });
                }
                // Animación de carga de energía de Sofía (frames 0-1 en bucle)
                if (this.textures.exists('sofia_charge') && !this.anims.exists('sofia_charge_anim')) {
                    const texCharge = this.textures.get('sofia_charge');
                    let totalCharge = 1;
                    try {
                        if (texCharge && typeof texCharge.frameTotal === 'number') totalCharge = Math.max(1, texCharge.frameTotal);
                        else if (texCharge && texCharge.frames) totalCharge = Math.max(1, Object.keys(texCharge.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalCharge = 1; }
                    const endCharge = Math.min(1, Math.max(0, totalCharge - 1));
                    const framesCharge = this.anims.generateFrameNumbers('sofia_charge', { start: 0, end: endCharge });
                    this.anims.create({ key: 'sofia_charge_anim', frames: framesCharge, frameRate: 8, repeat: -1 });
                }
            } catch (e) { /* ignore sofia override errors */ }
            
            // Overrides específicos para Franchesca (char2 / pj3)
            try {
                // Caminar: frames 0-3
                if (this.textures.exists('char2_walk')) {
                    if (this.anims.exists('char2_walk')) this.anims.remove('char2_walk');
                    const texFranWalk = this.textures.get('char2_walk');
                    let totalFranWalk = 1;
                    try {
                        if (texFranWalk && typeof texFranWalk.frameTotal === 'number') totalFranWalk = Math.max(1, texFranWalk.frameTotal);
                        else if (texFranWalk && texFranWalk.frames) totalFranWalk = Math.max(1, Object.keys(texFranWalk.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalFranWalk = 1; }
                    const endFranWalk = Math.min(3, Math.max(0, totalFranWalk - 1));
                    const framesFranWalk = this.anims.generateFrameNumbers('char2_walk', { start: 0, end: endFranWalk });
                    this.anims.create({ key: 'char2_walk', frames: framesFranWalk, frameRate: 6, repeat: -1 });
                }

                // Golpe: frames 0-3
                if (this.textures.exists('char2_punch')) {
                    if (this.anims.exists('char2_punch')) this.anims.remove('char2_punch');
                    const texFranPunch = this.textures.get('char2_punch');
                    let totalFranPunch = 1;
                    try {
                        if (texFranPunch && typeof texFranPunch.frameTotal === 'number') totalFranPunch = Math.max(1, texFranPunch.frameTotal);
                        else if (texFranPunch && texFranPunch.frames) totalFranPunch = Math.max(1, Object.keys(texFranPunch.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalFranPunch = 1; }
                    const endFranPunch = Math.min(3, Math.max(0, totalFranPunch - 1));
                    const framesFranPunch = this.anims.generateFrameNumbers('char2_punch', { start: 0, end: endFranPunch });
                    this.anims.create({ key: 'char2_punch', frames: framesFranPunch, frameRate: 14, repeat: 0 });
                }

                // Animación de ataque aéreo (frames 0-3) - fran_air_aoe
                if (this.textures.exists('fran_air_aoe') && !this.anims.exists('fran_air_aoe')) {
                    const texFranAoe = this.textures.get('fran_air_aoe');
                    let totalFranAoe = 1;
                    try {
                        if (texFranAoe && typeof texFranAoe.frameTotal === 'number') totalFranAoe = Math.max(1, texFranAoe.frameTotal);
                        else if (texFranAoe && texFranAoe.frames) totalFranAoe = Math.max(1, Object.keys(texFranAoe.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalFranAoe = 1; }
                    const endFranAoe = Math.min(3, Math.max(0, totalFranAoe - 1));
                    const framesAoe = this.anims.generateFrameNumbers('fran_air_aoe', { start: 0, end: endFranAoe });
                    this.anims.create({ key: 'fran_air_aoe', frames: framesAoe, frameRate: 12, repeat: 0 });
                }
            } catch (e) { /* ignore franchesca override errors */ }

            // Overrides específicos para Charles (char0 / pj1)
            try {
                // Idle ya usa frame 0 del spritesheet 'char0_idle' (pj1-skill1) por lógica en update (no anim loop)
                // Caminar: usar frames 0-3 de 'pj1-caminar'
                if (this.textures.exists('char0_walk')) {
                    if (this.anims.exists('char0_walk')) this.anims.remove('char0_walk');
                    const texWalk0 = this.textures.get('char0_walk');
                    let totalWalk0 = 1;
                    try {
                        if (texWalk0 && typeof texWalk0.frameTotal === 'number') totalWalk0 = Math.max(1, texWalk0.frameTotal);
                        else if (texWalk0 && texWalk0.frames) totalWalk0 = Math.max(1, Object.keys(texWalk0.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalWalk0 = 1; }
                    const endWalk0 = Math.min(3, Math.max(0, totalWalk0 - 1));
                    const framesWalk0 = this.anims.generateFrameNumbers('char0_walk', { start: 0, end: endWalk0 });
                    this.anims.create({ key: 'char0_walk', frames: framesWalk0, frameRate: 6, repeat: -1 });
                }

                // Golpe normal: frames 0-3 de pj1-golpe
                if (this.textures.exists('char0_punch')) {
                    if (this.anims.exists('char0_punch')) this.anims.remove('char0_punch');
                    const texPunch0 = this.textures.get('char0_punch');
                    let totalPunch0 = 1;
                    try {
                        if (texPunch0 && typeof texPunch0.frameTotal === 'number') totalPunch0 = Math.max(1, texPunch0.frameTotal);
                        else if (texPunch0 && texPunch0.frames) totalPunch0 = Math.max(1, Object.keys(texPunch0.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalPunch0 = 1; }
                    const endPunch0 = Math.min(3, Math.max(0, totalPunch0 - 1));
                    const framesPunch0 = this.anims.generateFrameNumbers('char0_punch', { start: 0, end: endPunch0 });
                    this.anims.create({ key: 'char0_punch', frames: framesPunch0, frameRate: 14, repeat: 0 });
                }

                // Golpe que quema (combo): usar pj1-skill1 frames 0-6
                if (this.textures.exists('char0_punch_fire')) {
                    if (this.anims.exists('char0_punch_fire')) this.anims.remove('char0_punch_fire');
                    const texPF0 = this.textures.get('char0_punch_fire');
                    let totalPF0 = 1;
                    try {
                        if (texPF0 && typeof texPF0.frameTotal === 'number') totalPF0 = Math.max(1, texPF0.frameTotal);
                        else if (texPF0 && texPF0.frames) totalPF0 = Math.max(1, Object.keys(texPF0.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalPF0 = 1; }
                    const endPF0 = Math.min(6, Math.max(0, totalPF0 - 1));
                    const framesPF0 = this.anims.generateFrameNumbers('char0_punch_fire', { start: 0, end: endPF0 });
                    // Mucho más lenta (de 16 -> 3 fps)
                    this.anims.create({ key: 'char0_punch_fire', frames: framesPF0, frameRate: 3, repeat: 0 });
                }

                // Golpe transformado: usar pj1-trans frames 0-3
                if (this.textures.exists('char0_trans')) {
                    if (!this.anims.exists('char0_trans_punch')) {
                        const texT0 = this.textures.get('char0_trans');
                        let totalT0 = 1;
                        try {
                            if (texT0 && typeof texT0.frameTotal === 'number') totalT0 = Math.max(1, texT0.frameTotal);
                            else if (texT0 && texT0.frames) totalT0 = Math.max(1, Object.keys(texT0.frames).filter(k => !isNaN(+k)).length);
                        } catch (e) { totalT0 = 1; }
                        const endT0 = Math.min(3, Math.max(0, totalT0 - 1));
                        const framesT0 = this.anims.generateFrameNumbers('char0_trans', { start: 0, end: endT0 });
                        this.anims.create({ key: 'char0_trans_punch', frames: framesT0, frameRate: 14, repeat: 0 });
                    }
                }
            } catch (e) { /* ignore charles override errors */ }
            
            // Animaciones para Mario (char3 / pj4)
            try {
                // Animación de golpe de Mario (frames 1-5)
                if (this.textures.exists('mario_punch') && !this.anims.exists('mario_punch')) {
                    const texMarioPunch = this.textures.get('mario_punch');
                    let totalMarioPunch = 1;
                    try {
                        if (texMarioPunch && typeof texMarioPunch.frameTotal === 'number') totalMarioPunch = Math.max(1, texMarioPunch.frameTotal);
                        else if (texMarioPunch && texMarioPunch.frames) totalMarioPunch = Math.max(1, Object.keys(texMarioPunch.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalMarioPunch = 1; }
                    const endMarioPunch = Math.min(5, Math.max(1, totalMarioPunch - 1));
                    const framesMarioPunch = this.anims.generateFrameNumbers('mario_punch', { start: 1, end: endMarioPunch });
                    this.anims.create({ key: 'mario_punch', frames: framesMarioPunch, frameRate: 18, repeat: 0 });
                }
                // Animación de caminar de Mario (frames 0-2) con frameRate lento
                if (this.textures.exists('mario_walk') && !this.anims.exists('mario_walk')) {
                    const texMarioWalk = this.textures.get('mario_walk');
                    let totalMarioWalk = 1;
                    try {
                        if (texMarioWalk && typeof texMarioWalk.frameTotal === 'number') totalMarioWalk = Math.max(1, texMarioWalk.frameTotal);
                        else if (texMarioWalk && texMarioWalk.frames) totalMarioWalk = Math.max(1, Object.keys(texMarioWalk.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalMarioWalk = 1; }
                    const endMarioWalk = Math.min(2, Math.max(0, totalMarioWalk - 1));
                    const framesMarioWalk = this.anims.generateFrameNumbers('mario_walk', { start: 0, end: endMarioWalk });
                    this.anims.create({ key: 'mario_walk', frames: framesMarioWalk, frameRate: 4, repeat: -1 });
                }
                // Animación de bloqueo de Mario (solo frame 0, estático)
                if (this.textures.exists('mario_block') && !this.anims.exists('mario_block')) {
                    const framesMarioBlock = this.anims.generateFrameNumbers('mario_block', { start: 0, end: 0 });
                    this.anims.create({ key: 'mario_block', frames: framesMarioBlock, frameRate: 1, repeat: 0 });
                }
                // Animación de carga de energía de Mario (frames 0-1 en bucle)
                if (this.textures.exists('mario_charge') && !this.anims.exists('mario_charge_anim')) {
                    const texMarioCharge = this.textures.get('mario_charge');
                    let totalMarioCharge = 1;
                    try {
                        if (texMarioCharge && typeof texMarioCharge.frameTotal === 'number') totalMarioCharge = Math.max(1, texMarioCharge.frameTotal);
                        else if (texMarioCharge && texMarioCharge.frames) totalMarioCharge = Math.max(1, Object.keys(texMarioCharge.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalMarioCharge = 1; }
                    const endMarioCharge = Math.min(1, Math.max(0, totalMarioCharge - 1));
                    const framesMarioCharge = this.anims.generateFrameNumbers('mario_charge', { start: 0, end: endMarioCharge });
                    this.anims.create({ key: 'mario_charge_anim', frames: framesMarioCharge, frameRate: 8, repeat: -1 });
                }
            } catch (e) { /* ignore mario override errors */ }
            
            // Animaciones para enemigos
            try {
                // Animación idle del enemigo volador (frame 0 estático)
                if (this.textures.exists('flying_enemy') && !this.anims.exists('flying_enemy_idle')) {
                    const framesIdle = this.anims.generateFrameNumbers('flying_enemy', { start: 0, end: 0 });
                    this.anims.create({ key: 'flying_enemy_idle', frames: framesIdle, frameRate: 1, repeat: -1 });
                }
                // Animación de disparo del enemigo volador (frames 0-1)
                if (this.textures.exists('flying_enemy') && !this.anims.exists('flying_enemy_shoot')) {
                    const texFlyingShoot = this.textures.get('flying_enemy');
                    let totalFlyingShoot = 1;
                    try {
                        if (texFlyingShoot && typeof texFlyingShoot.frameTotal === 'number') totalFlyingShoot = Math.max(1, texFlyingShoot.frameTotal);
                        else if (texFlyingShoot && texFlyingShoot.frames) totalFlyingShoot = Math.max(1, Object.keys(texFlyingShoot.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalFlyingShoot = 1; }
                    const endFlyingShoot = Math.min(1, Math.max(0, totalFlyingShoot - 1));
                    const framesShoot = this.anims.generateFrameNumbers('flying_enemy', { start: 0, end: endFlyingShoot });
                    this.anims.create({ key: 'flying_enemy_shoot', frames: framesShoot, frameRate: 10, repeat: 0 });
                }
                // Animación de caminar del enemigo terrestre (frames 0-5)
                if (this.textures.exists('ground_enemy_walk') && !this.anims.exists('ground_enemy_walk')) {
                    const texGroundWalk = this.textures.get('ground_enemy_walk');
                    let totalGroundWalk = 1;
                    try {
                        if (texGroundWalk && typeof texGroundWalk.frameTotal === 'number') totalGroundWalk = Math.max(1, texGroundWalk.frameTotal);
                        else if (texGroundWalk && texGroundWalk.frames) totalGroundWalk = Math.max(1, Object.keys(texGroundWalk.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalGroundWalk = 1; }
                    const endGroundWalk = Math.min(5, Math.max(0, totalGroundWalk - 1));
                    const framesGroundWalk = this.anims.generateFrameNumbers('ground_enemy_walk', { start: 0, end: endGroundWalk });
                    this.anims.create({ key: 'ground_enemy_walk', frames: framesGroundWalk, frameRate: 10, repeat: -1 });
                }
                // Animación de ataque del enemigo terrestre (frames 0-5)
                if (this.textures.exists('ground_enemy_attack') && !this.anims.exists('ground_enemy_attack')) {
                    const texGroundAttack = this.textures.get('ground_enemy_attack');
                    let totalGroundAttack = 1;
                    try {
                        if (texGroundAttack && typeof texGroundAttack.frameTotal === 'number') totalGroundAttack = Math.max(1, texGroundAttack.frameTotal);
                        else if (texGroundAttack && texGroundAttack.frames) totalGroundAttack = Math.max(1, Object.keys(texGroundAttack.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalGroundAttack = 1; }
                    const endGroundAttack = Math.min(5, Math.max(0, totalGroundAttack - 1));
                    const framesGroundAttack = this.anims.generateFrameNumbers('ground_enemy_attack', { start: 0, end: endGroundAttack });
                    this.anims.create({ key: 'ground_enemy_attack', frames: framesGroundAttack, frameRate: 18, repeat: 0 });
                }
                // Animaciones del jefe final
                if (this.textures.exists('boss_walk')) {
                    // Idle: frame 0 estático
                    if (!this.anims.exists('boss_idle')) {
                        const framesIdleBoss = this.anims.generateFrameNumbers('boss_walk', { start: 0, end: 0 });
                        this.anims.create({ key: 'boss_idle', frames: framesIdleBoss, frameRate: 1, repeat: -1 });
                    }
                    // Mover: frames 1-2 en loop
                    if (!this.anims.exists('boss_move')) {
                        const texBossWalk = this.textures.get('boss_walk');
                        let totalBossWalk = 1;
                        try {
                            if (texBossWalk && typeof texBossWalk.frameTotal === 'number') totalBossWalk = Math.max(1, texBossWalk.frameTotal);
                            else if (texBossWalk && texBossWalk.frames) totalBossWalk = Math.max(1, Object.keys(texBossWalk.frames).filter(k => !isNaN(+k)).length);
                        } catch (e) { totalBossWalk = 1; }
                        const endBossMove = Math.min(2, Math.max(1, totalBossWalk - 1));
                        const framesBossMove = this.anims.generateFrameNumbers('boss_walk', { start: 1, end: endBossMove });
                        this.anims.create({ key: 'boss_move', frames: framesBossMove, frameRate: 6, repeat: -1 });
                    }
                }
                // Ataque de área: frames 0-3 (más lento)
                if (this.textures.exists('boss_attack') && !this.anims.exists('boss_attack_anim')) {
                    const texBossAtk = this.textures.get('boss_attack');
                    let totalBossAtk = 1;
                    try {
                        if (texBossAtk && typeof texBossAtk.frameTotal === 'number') totalBossAtk = Math.max(1, texBossAtk.frameTotal);
                        else if (texBossAtk && texBossAtk.frames) totalBossAtk = Math.max(1, Object.keys(texBossAtk.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalBossAtk = 1; }
                    const endBossAtk = Math.min(3, Math.max(0, totalBossAtk - 1));
                    const framesBossAtk = this.anims.generateFrameNumbers('boss_attack', { start: 0, end: endBossAtk });
                    this.anims.create({ key: 'boss_attack_anim', frames: framesBossAtk, frameRate: 4, repeat: 0 });
                }
                // Muerte del jefe: frames 0-1
                if (this.textures.exists('boss_death') && !this.anims.exists('boss_death')) {
                    const texBossDeath = this.textures.get('boss_death');
                    let totalBossDeath = 1;
                    try {
                        if (texBossDeath && typeof texBossDeath.frameTotal === 'number') totalBossDeath = Math.max(1, texBossDeath.frameTotal);
                        else if (texBossDeath && texBossDeath.frames) totalBossDeath = Math.max(1, Object.keys(texBossDeath.frames).filter(k => !isNaN(+k)).length);
                    } catch (e) { totalBossDeath = 1; }
                    const endBossDeath = Math.min(1, Math.max(0, totalBossDeath - 1));
                    const framesBossDeath = this.anims.generateFrameNumbers('boss_death', { start: 0, end: endBossDeath });
                    this.anims.create({ key: 'boss_death', frames: framesBossDeath, frameRate: 6, repeat: 0 });
                }
            } catch (e) { /* ignore enemy anim errors */ }
        } catch (e) { /* ignore charles bullet anim errors */ }
        // Fallback textures: si faltan algunos assets (target / tex_bullet), créalos con gráficos simples
        try {
            if (!this.textures.exists('target')) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0xffff00, 1);
                g.fillCircle(8, 8, 8);
                g.generateTexture('target', 16, 16);
                g.destroy();
            }
            if (!this.textures.exists('tex_bullet')) {
                const g2 = this.make.graphics({ x: 0, y: 0, add: false });
                g2.fillStyle(0xffffff, 1);
                g2.fillRect(0, 0, 6, 6);
                g2.generateTexture('tex_bullet', 6, 6);
                g2.destroy();
            }
        } catch (e) { /* ignore fallback generation errors */ }
        this.scene.start('Menu');
    }

    createAnimations() {
        // Crear animaciones globales por personaje usando spritesheet + generateFrameNumbers
        for (let i = 0; i < 4; i++) {
            const actions = ['walk', 'idle', 'shoot', 'punch', 'block', 'charge', 'hurt', 'jump','punch_fire','kick','robo'];
            actions.forEach(act => {
                const key = `char${i}_${act}`;
                if (!this.textures.exists(key)) return; // evita errores si falta
                const tex = this.textures.get(key);

                // Calcular cantidad total de frames del spritesheet
                let totalFrames = 1;
                try {
                    if (tex && typeof tex.frameTotal === 'number') totalFrames = Math.max(1, tex.frameTotal);
                    else if (tex && tex.frames) {
                        // contar solo claves numéricas
                        totalFrames = Math.max(1, Object.keys(tex.frames).filter(k => !isNaN(+k)).length);
                    }
                } catch (e) { totalFrames = 1; }
                const endFrame = Math.max(0, totalFrames - 1);

                // Generar frames 0..end usando generateFrameNumbers
                let frames;
                try {
                    frames = this.anims.generateFrameNumbers(key, { start: 0, end: endFrame });
                } catch (e) {
                    frames = [{ key, frame: 0 }];
                }

                // Frame rate por acción
                let frameRate = 12;
                if (act === 'walk' || act === 'idle') frameRate = 6;
                if (act === 'punch' || act === 'shoot' || act === 'punch_fire' || act === 'kick') frameRate = 4;

                // Repetición: no repetir para ataques puntuales
                const repeat = (act === 'punch' || act === 'shoot' || act === 'jump' || act === 'punch_fire' || act === 'kick' || act === 'robo') ? 0 : -1;

                // Evitar recrear si ya existe
                if (!this.anims.exists(key)) {
                    this.anims.create({ key, frames, frameRate, repeat });
                }
                // Debug: log de frames
                try {
                    console.log(`ANIM CREATED: ${key} total=${totalFrames} fr=${frameRate} rep=${repeat}`);
                } catch (e) { }
            });
        }
    }
}


// --- ESCENA MENU ---
export class Menu extends Phaser.Scene {
   
    constructor() { super("Menu"); }
    create() {
        const { width } = this.scale;
        try { ensureMenuBackground(this); } catch (e) {}
        // Música de menú
        ensureMenuMusic(this);
        this.selectedIndex = 0;
        this.buttons = [];

        this.updateTexts = () => {
            this.title.setText(isEnglish ? "THE FURY OF THE ABYSS" : "LA FURIA DEL ABISMO");
            this.playText.setText(isEnglish ? "PLAY" : "JUGAR");
            this.langText.setText(isEnglish ? "LANGUAGE" : "IDIOMA");
            this.controlsText.setText(isEnglish ? "CONTROLS" : "CONTROLES");
        };

        this.cameras.main.setBackgroundColor(0x001d33);

        try { ensureMenuBackground(this); } catch (e) {}
        this.title = this.add.text(width / 2, 80, isEnglish ? "THE FURY OF THE ABYSS" : "LA FURIA DEL ABISMO", { font: "72px Arial", color: "#00e5ff" }).setOrigin(0.5);

        const buttonWidth = 250, buttonHeight = 70, spacing = 40;
        let startY = 250;

        const playButton = this.add.rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x004466).setInteractive();
        this.playText = this.add.text(width / 2, startY, isEnglish ? "PLAY" : "JUGAR", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        this.buttons.push({ rect: playButton, callback: () => this.cleanupAndStart("ModeSelector") });

        startY += buttonHeight + spacing;
        const langButton = this.add.rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x003355).setInteractive();
        this.langText = this.add.text(width / 2, startY, isEnglish ? "LANGUAGE" : "IDIOMA", { font: "28px Arial", color: "#00ffcc" }).setOrigin(0.5);
        this.buttons.push({ rect: langButton, callback: () => { isEnglish = !isEnglish; this.updateTexts(); } });

        startY += buttonHeight + spacing;
    const controlsButton = this.add.rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x002244).setInteractive();
    this.controlsText = this.add.text(width / 2, startY, isEnglish ? "CONTROLS" : "CONTROLES", { font: "28px Arial", color: "#66ffff" }).setOrigin(0.5);
    this.buttons.push({ rect: controlsButton, callback: () => this.cleanupAndStart('ControlsScene') });

        // Marco selector
        this.selector = this.add.rectangle(this.buttons[this.selectedIndex].rect.x, this.buttons[this.selectedIndex].rect.y, buttonWidth + 10, buttonHeight + 10).setStrokeStyle(4, 0xffff00).setOrigin(0.5);

        // Keyboard nav: W/S and Up/Down both move selection
        this.pressedNavTime = 0;
        this.keyUp = this.input.keyboard.addKey('W');
        this.keyDown = this.input.keyboard.addKey('S');
        this.keyUp2 = this.input.keyboard.addKey('UP');
        this.keyDown2 = this.input.keyboard.addKey('DOWN');

        // Confirm keys: player1 SPACE, player2 ENTER
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        // Back keys: SHIFT (P1) and BACKSPACE (P2) - here no action in main menu
        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');

        // set up gamepad connect to init flags
        this.input.gamepad.on('connected', pad => {
            pad._upPressed = pad._downPressed = pad._aPressed = pad._bPressed = false;
        });
    }

    cleanupAndStart(sceneName, data) {
        // Remover listeners de botones antes de cambiar escena
        if (this.buttons) {
            this.buttons.forEach(btn => {
                if (btn.rect && btn.rect.removeAllListeners) {
                    try {
                        btn.rect.removeAllListeners();
                    } catch (e) {
                        // Ignore
                    }
                }
            });
        }
        this.scene.start(sceneName, data);
    }

    update(time) {
        // keyboard navigation (debounced)
        if (Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyUp2)) this.moveSelector(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyDown2)) this.moveSelector(1);

        // confirm with keyboard
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) {
            const btn = this.buttons[this.selectedIndex];
            if (btn && btn.callback) {
                // Si es el botón de idioma, ejecutar directamente (no cambia escena)
                if (this.selectedIndex === 1) {
                    btn.callback();
                } else {
                    // Para otros botones que cambian escena, usar cleanup
                    btn.callback();
                }
            }
        }

        // gamepad nav & confirm (works for all connected pads)
        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            // vertical axis navigation
            const y = (pad.axes.length > 1) ? pad.axes[1].getValue() : 0;
            if (y < -0.6 && !pad._upPressed) { this.moveSelector(-1); pad._upPressed = true; }
            else if (y > 0.6 && !pad._downPressed) { this.moveSelector(1); pad._downPressed = true; }
            else if (y > -0.6 && y < 0.6) { pad._upPressed = pad._downPressed = false; }

            // A to confirm
            const aPressed = pad.buttons[0] && pad.buttons[0].pressed;
            if (aPressed && !pad._aPressed) { 
                const btn = this.buttons[this.selectedIndex];
                if (btn && btn.callback) btn.callback();
                pad._aPressed = true; 
            }
            if (!aPressed) pad._aPressed = false;

            // B/back does nothing in main menu
        });
    }

    moveSelector(dir) {
        if (!this.buttons || this.buttons.length === 0) return;
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const button = this.buttons[this.selectedIndex];
        if (button && button.rect) { this.selector.x = button.rect.x; this.selector.y = button.rect.y; }
    }
}
// --- ESCENA CONTROLES ---
export class ControlsScene extends Phaser.Scene {
    constructor() { super("ControlsScene"); }
    create() {
        const { width, height } = this.scale;
        // Música de menú
        ensureMenuMusic(this);
    // Reset runtime flags so GameOver can be triggered repeatedly across matches
    this._gameOverCooldownUntil = 0;
        // Ensure background offset resets to default for a fresh layout
        this._bgYOffset = 48;
        if (this._bgOffsetText) { try { this._bgOffsetText.setText(`bg offset: ${this._bgYOffset}`); } catch (e) {} }
        // If a leftover background image exists on this scene instance, destroy it to avoid duplicates
        if (this._bgImage && this._bgImage.scene) {
            try { this._bgImage.destroy(); } catch (e) {}
            this._bgImage = null;
        }
        this.cameras.main.setBackgroundColor(0x001d33);

        const title = this.add.text(40, 40, isEnglish ? "CONTROLS (GAMEPAD)" : "CONTROLES (MANDO)", { font: "36px Arial", color: "#00ffff" }).setOrigin(0, 0);

        let y = 100;
        const leftX = 40;
        const line = (txt) => {
            this.add.text(leftX, y, txt, { font: "22px Arial", color: "#ffffff", align: 'left' }).setOrigin(0, 0);
            y += 32;
        };

        // Gamepad-only controls (left aligned)
        line(isEnglish ? "Move: Left stick (horizontal)" : "Mover: palanca izquierda (horizontal)");
        line(isEnglish ? "Jump: Push left stick UP" : "Saltar: empujar palanca izquierda HACIA ARRIBA");
        line(isEnglish ? "Punch: X button" : "Golpe: botón X");
        line(isEnglish ? "Block/Charge: A button" : "Bloquear/Cargar: botón A");
        line(isEnglish ? "Shoot: B button" : "Disparar: botón B");
        y += 10;

    // Special notes: Franchesca combos and all characters' abilities
    line(isEnglish ? "Franchesca special (examples):" : "Franchesca - instrucciones especiales:");
    line(isEnglish ? "Right, Right + Punch = Steal" : "Derecha, Derecha + Golpe = Robo (robar habilidad)");
    line(isEnglish ? "Left, Left + Punch = Use stolen ability" : "Izquierda, Izquierda + Golpe = Usar habilidad robada");
    y += 8;

    // Abilities for each character
    line(isEnglish ? "Charles - Abilities:" : "Charles - Habilidades:");
    line(isEnglish ? "1) Left, Right + Punch: Quick dash hit" : "1) Izq, Der + Golpe: Embestida rápida");
    line(isEnglish ? "2) Right, Left + Punch: Shield burst" : "2) Der, Izq + Golpe: Explosión de escudo");
    line(isEnglish ? "3) Right, Right + Punch: Ground slam" : "3) Der, Der + Golpe: Golpe al suelo");
    y += 6;

    line(isEnglish ? "Sofia - Abilities:" : "Sofia - Habilidades:");
    line(isEnglish ? "1) Left, Right + Punch: Swift shot" : "1) Izq, Der + Golpe: Disparo veloz");
    line(isEnglish ? "2) Right, Left + Punch: Energy bubble" : "2) Der, Izq + Golpe: Burbuja energética");
    line(isEnglish ? "3) Right, Right + Punch: Aerial flip" : "3) Der, Der + Golpe: Voltereta aérea");
    y += 6;

    line(isEnglish ? "Franchesca - Abilities:" : "Franchesca - Habilidades:");
    line(isEnglish ? "1) Left, Right + Punch: Steal minor item" : "1) Izq, Der + Golpe: Robar ítem menor");
    line(isEnglish ? "2) Right, Left + Punch: Quick vanish" : "2) Der, Izq + Golpe: Desvanecimiento rápido");
    line(isEnglish ? "3) Right, Right + Punch: Steal major ability" : "3) Der, Der + Golpe: Robar habilidad mayor");
    y += 6;

    line(isEnglish ? "Mario - Abilities:" : "Mario - Habilidades:");
    line(isEnglish ? "1) Left, Right + Punch: Fire dash" : "1) Izq, Der + Golpe: Carrera de fuego");
    line(isEnglish ? "2) Right, Left + Punch: Power throw" : "2) Der, Izq + Golpe: Lanzamiento potente");
    line(isEnglish ? "3) Right, Right + Punch: Spin upper" : "3) Der, Der + Golpe: Giro ascendente");
    y += 12;

        // Botón para volver
        const backBtn = this.add.rectangle(width / 2, height - 70, 220, 60, 0x003355).setInteractive();
        const backTxt = this.add.text(width / 2, height - 70, isEnglish ? "BACK" : "VOLVER", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { try { this.scene.start("Menu"); } catch (e) { console.warn('Failed to go back to Menu:', e); } });

        // Tecla ESC para volver
        this.input.keyboard.on('keydown-ESC', () => this.scene.start("Menu"));
        // Enter o Space también vuelven
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start("Menu"));
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start("Menu"));
    }
}


// --- ESCENA MODE SELECTOR ---
export class ModeSelector extends Phaser.Scene {
    constructor() { super("ModeSelector"); }
    create() {
        // Música de menú
        ensureMenuMusic(this);
        try { ensureMenuBackground(this); } catch (e) {}
        const { width, height } = this.scale;
        this.selectedIndex = 0;
        this.buttons = [];

        this.cameras.main.setBackgroundColor(0x001933);
        const buttonSize = 200, spacing = 100;
        const centerX = width / 2, centerY = height / 2;

        const versusButton = this.add.rectangle(centerX - buttonSize / 2 - spacing / 2, centerY, buttonSize, buttonSize, 0x004466).setInteractive();
        const coopButton = this.add.rectangle(centerX + buttonSize / 2 + spacing / 2, centerY, buttonSize, buttonSize, 0x003366).setInteractive();

        const t1 = this.add.text(versusButton.x, versusButton.y, "VERSUS", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        const t2 = this.add.text(coopButton.x, coopButton.y, "CO-OP", { font: "28px Arial", color: "#66ffff" }).setOrigin(0.5);

        this.buttons.push({ rect: versusButton, callback: () => this.scene.start("CharacterSelector", { mode: "versus" }) });
        this.buttons.push({ rect: coopButton, callback: () => this.scene.start("CharacterSelector", { mode: "cooperativo" }) });

        this.selector = this.add.rectangle(this.buttons[this.selectedIndex].rect.x, this.buttons[this.selectedIndex].rect.y, buttonSize + 10, buttonSize + 10).setStrokeStyle(4, 0xffff00).setOrigin(0.5);

        // keyboard nav
        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');

        // confirm/back
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE'); // player1
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER'); // player2
        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');

        this.input.gamepad.on('connected', pad => {
            pad._leftPressed = pad._rightPressed = false;
            pad._aPressed = pad._bPressed = false;
        });

    versusButton.once('pointerdown', () => { 
        try { 
            this.cleanupAndStart("CharacterSelector", { mode: "versus" }); 
        } catch (e) { 
            console.warn('Failed to start CharacterSelector (versus):', e); 
        } 
    });
    coopButton.once('pointerdown', () => { 
        try { 
            this.cleanupAndStart("CharacterSelector", { mode: "cooperativo" }); 
        } catch (e) { 
            console.warn('Failed to start CharacterSelector (cooperativo):', e); 
        } 
    });
    }

    cleanupAndStart(sceneName, data) {
        // Remover listeners de botones antes de cambiar escena
        this.buttons.forEach(btn => {
            if (btn.rect && btn.rect.removeAllListeners) {
                btn.rect.removeAllListeners();
            }
        });
        this.scene.start(sceneName, data);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyLeft2)) this.moveSelector(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyRight2)) this.moveSelector(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) {
            const btn = this.buttons && this.buttons[this.selectedIndex];
            if (btn && typeof btn.callback === 'function') {
                this.cleanupAndStart("CharacterSelector", btn.callback === this.buttons[0].callback ? { mode: "versus" } : { mode: "cooperativo" });
            }
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP1) || Phaser.Input.Keyboard.JustDown(this.keyBackP2)) {
            this.buttons.forEach(btn => {
                if (btn.rect && btn.rect.removeAllListeners) btn.rect.removeAllListeners();
            });
            this.scene.start("Menu");
        }

        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (x < -0.6 && !pad._leftPressed) { this.moveSelector(-1); pad._leftPressed = true; }
            else if (x > 0.6 && !pad._rightPressed) { this.moveSelector(1); pad._rightPressed = true; }
            else if (x > -0.6 && x < 0.6) { pad._leftPressed = pad._rightPressed = false; }

            // A confirm
            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) {
                const btn = this.buttons && this.buttons[this.selectedIndex];
                if (btn && typeof btn.callback === 'function') { 
                    this.cleanupAndStart("CharacterSelector", btn.callback === this.buttons[0].callback ? { mode: "versus" } : { mode: "cooperativo" });
                    pad._aPressed = true; 
                }
            }
            if (!a) pad._aPressed = false;

            // B back
            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) { 
                this.buttons.forEach(btn => {
                    if (btn.rect && btn.rect.removeAllListeners) btn.rect.removeAllListeners();
                });
                this.scene.start("Menu"); 
                pad._bPressed = true; 
            }
            if (!b) pad._bPressed = false;
        });
    }

    moveSelector(dir) {
        if (!this.buttons || this.buttons.length === 0) return;
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const b = this.buttons[this.selectedIndex];
        if (b && b.rect) { this.selector.x = b.rect.x; this.selector.y = b.rect.y; }
    }
}

// --- ESCENA CHARACTER SELECTOR ---
export class CharacterSelector extends Phaser.Scene {
    constructor() { super("CharacterSelector"); }
    init(data) { this.selectedMode = data.mode || "versus"; }

    create() {
        // Música de menú
        ensureMenuMusic(this);
        const { width, height } = this.scale;
        // Ensure we are not in fullscreen mode when showing the GameOver UI.
        // Some browsers/platforms keep the canvas scaled and that causes the map to be mispositioned when
        // restarting while still in fullscreen. Force exit fullscreen here using Phaser and a document fallback.
        try {
            if (this.scale && this.scale.isFullscreen) this.scale.stopFullscreen();
        } catch (e) { /* ignore */ }
        // Fallback: try the DOM fullscreen API (some browsers don't properly toggle via Phaser)
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

        // selections default: player1 left, player2 right
        this.playerSelections = [{ index: 0 }, { index: this.characters.length - 1 }];
        this.characterRects = [];

        const rectWidth = 200, rectHeight = 300, spacing = 40;
        const totalWidth = this.characters.length * rectWidth + (this.characters.length - 1) * spacing;
        let startX = (width - totalWidth) / 2 + rectWidth / 2;
        const centerY = height / 2;

        this.characters.forEach((char, i) => {
            const box = this.add.rectangle(startX, centerY, rectWidth, rectHeight, char.color).setStrokeStyle(2, 0x000000).setInteractive();
            const spriteKey = `char${i}_idle`;
            // add character preview sprite (centered a bit above)
            let preview = null;
            if (this.textures.exists(spriteKey)) {
                preview = this.add.sprite(startX, centerY - 20, spriteKey);
                // force display size to 64x64 for preview thumbnails
                preview.setDisplaySize(64, 64);
                // if the texture has multiple frames, show only the first frame for preview
                if (this.anims.exists(spriteKey)) {
                    try { preview.setFrame(0); } catch (e) { /* ignore if frame setting fails */ }
                }
            } else {
                preview = this.add.rectangle(startX, centerY - 20, rectWidth - 40, rectHeight - 120, char.color).setStrokeStyle(1, 0x000000);
            }
            this.add.text(startX, centerY + rectHeight / 2 + 25, char.name, { font: "22px Arial", color: "#00ffff" }).setOrigin(0.5);
            // click assigns to player1 by default and unconfirms player1 (so they must confirm again)
            box.on('pointerdown', (ptr) => {
                this.playerSelections[0].index = i;
                this.unconfirmSelection(0);
                this.updateSelectors();
            });
            this.characterRects.push(box);
            // store preview sprite so we can follow selection
            box.preview = preview;
            startX += rectWidth + spacing;
        });

        // Player frames (player1: yellow, player2: orange)
        this.playerSelectors = [
            this.add.rectangle(this.characterRects[this.playerSelections[0].index].x, centerY, rectWidth + 12, rectHeight + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5),
            this.add.rectangle(this.characterRects[this.playerSelections[1].index].x, centerY, rectWidth + 12, rectHeight + 12).setStrokeStyle(4, 0xffaa00).setOrigin(0.5)
        ];

        // confirmed flags (both must be true to advance)
        this.confirmed = [false, false];

        // Keyboard controls for selection:
        // Player1 uses A/D and SPACE to confirm
        this.keyLeftP1 = this.input.keyboard.addKey('A');
        this.keyRightP1 = this.input.keyboard.addKey('D');
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');

        // Player2 uses LEFT/RIGHT and ENTER to confirm
        this.keyLeftP2 = this.input.keyboard.addKey('LEFT');
        this.keyRightP2 = this.input.keyboard.addKey('RIGHT');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        // Back keys
        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');

        // Gamepad flags
        this.input.gamepad.on('connected', pad => {
            pad._leftPressed = pad._rightPressed = false;
            pad._aPressed = pad._bPressed = false;
        });

        // Update selectors initial
        this.updateSelectors();
    }

    // helper: confirm/unconfirm visuals and logic
    confirmSelection(idx) {
        this.confirmed[idx] = true;
        // set stroke to green when confirmed
        if (this.playerSelectors[idx]) this.playerSelectors[idx].setStrokeStyle(4, 0x00ff00);
        // advance only if both confirmed
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
        // restore original color
        if (this.playerSelectors[idx]) {
            const color = (idx === 0) ? 0xffff00 : 0xffaa00;
            this.playerSelectors[idx].setStrokeStyle(4, color);
        }
    }

    update() {
        // Gamepad navigation for two controllers (index 0 and 1)
        const pads = this.input.gamepad.gamepads;

        // Player1 keyboard nav
        if (Phaser.Input.Keyboard.JustDown(this.keyLeftP1)) { this.playerSelections[0].index = Phaser.Math.Wrap(this.playerSelections[0].index - 1, 0, this.characterRects.length); this.unconfirmSelection(0); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyRightP1)) { this.playerSelections[0].index = Phaser.Math.Wrap(this.playerSelections[0].index + 1, 0, this.characterRects.length); this.unconfirmSelection(0); this.updateSelectors(); }
        // Player2 keyboard nav
        if (Phaser.Input.Keyboard.JustDown(this.keyLeftP2)) { this.playerSelections[1].index = Phaser.Math.Wrap(this.playerSelections[1].index - 1, 0, this.characterRects.length); this.unconfirmSelection(1); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyRightP2)) { this.playerSelections[1].index = Phaser.Math.Wrap(this.playerSelections[1].index + 1, 0, this.characterRects.length); this.unconfirmSelection(1); this.updateSelectors(); }

        // Confirm with keyboard: mark respective player as confirmed; only start when both confirmed
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1)) this.confirmSelection(0);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.confirmSelection(1);

        // Back: unconfirm or go back to ModeSelector if both unconfirmed
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP1)) {
            if (this.confirmed[0]) this.unconfirmSelection(0);
            else this.scene.start("ModeSelector");
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP2)) {
            if (this.confirmed[1]) this.unconfirmSelection(1);
            else this.scene.start("ModeSelector");
        }

        // Pads navigation (each pad controls its respective player selection)
        pads.forEach((pad, i) => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            const sel = this.playerSelections[i] || this.playerSelections[0];

            if (x < -0.55 && !pad._leftPressed) { sel.index = Phaser.Math.Wrap(sel.index - 1, 0, this.characterRects.length); pad._leftPressed = true; this.unconfirmSelection(i); this.updateSelectors(); }
            else if (x > 0.55 && !pad._rightPressed) { sel.index = Phaser.Math.Wrap(sel.index + 1, 0, this.characterRects.length); pad._rightPressed = true; this.unconfirmSelection(i); this.updateSelectors(); }
            else if (x > -0.55 && x < 0.55) pad._leftPressed = pad._rightPressed = false;

            // A confirm
            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) {
                this.confirmSelection(i);
                pad._aPressed = true;
            }
            if (!a) pad._aPressed = false;

            // B back
            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) {
                if (this.confirmed[i]) this.unconfirmSelection(i);
                else this.scene.start("ModeSelector");
                pad._bPressed = true;
            }
            if (!b) pad._bPressed = false;
        });
    }

    moveSelector(dir) {
        if (!this.buttons || this.buttons.length === 0) return;
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const b = this.buttons[this.selectedIndex];
        if (b && b.rect) { this.selector.x = b.rect.x; this.selector.y = b.rect.y; }
    }

    // Agrega este método dentro de la clase CharacterSelector
    updateSelectors() {
        // Asegura que los marcos de selección sigan a los personajes seleccionados
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

// --- ESCENA MAP SELECTOR ---
export class MapSelector extends Phaser.Scene {
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
        try { ensureMenuBackground(this); } catch (e) {}
        this.title = this.add.text(width / 2, 80, isEnglish ? "Select a Map" : "Selecciona un Mapa", { font: "48px Arial", color: "#00ffff" }).setOrigin(0.5);
        this.mapText = this.add.text(width / 2, height / 2, this.maps[this.currentMap], { font: "36px Arial", color: "#66ffff" }).setOrigin(0.5);

        this.prev = this.add.text(width / 2 - 200, height / 2, "<", { font: "64px Arial", color: "#00ffff" }).setInteractive();
        this.next = this.add.text(width / 2 + 200, height / 2, ">", { font: "64px Arial", color: "#00ffff" }).setInteractive();

        this.startButton = this.add.rectangle(width / 2, height / 2 + 150, 200, 70, 0x004466).setInteractive();
        this.startText = this.add.text(width / 2, height / 2 + 150, isEnglish ? "START" : "EMPEZAR", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);

        this.prev.on('pointerdown', () => this.changeMap(-1));
        this.next.on('pointerdown', () => this.changeMap(1));
        this.startButton.on('pointerdown', () => {
            try { this.startGame(); } catch (e) { console.warn('startGame() failed:', e); }
        });

        // keyboard nav and confirm/back
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

// --- ESCENA GAME ---
export class GameScene extends Phaser.Scene {
    constructor() { super("GameScene"); }

    init(data) {
        this.player1Index = data.player1Index ?? 0;
        this.player2Index = data.player2Index ?? 1;
        this.mode = data.mode ?? "versus";
        this.selectedMap = data.map ?? "Mapa 1";
    }

    // Ensure player sprite exists with a live physics body, correct depth and colliders; rebind critical overlaps
    ensurePlayerSpriteValid() {
        try {
            if (!this.players || !this.players[0]) return;
            const p = this.players[0];
            let s = p.sprite;
            const needRecreate = !s || !s.scene || !s.body;
            const width = this.scale.width, height = this.scale.height;
            if (needRecreate) {
                const key = `char${this.player1Index}_idle`;
                const x = (s && s.x) ? s.x : (this._lastPlayerX || 200);
                const yDefault = (this.selectedMap === 'Mapa 1') ? (height - 20) : (height - 40);
                const y = (s && s.y) ? s.y : (this._lastPlayerY || yDefault);
                try { if (s && s.destroy) s.destroy(); } catch (e) {}
                s = this.physics.add.sprite(x, y, key).setCollideWorldBounds(true);
                try { s.setDisplaySize(64, 64); } catch (e) {}
                if (s.body && s.body.setSize) s.body.setSize(40, 56).setOffset(12, 8);
                try { s.setFrame(0); } catch (e) {}
                p.sprite = s;
                if (this.mode === 'cooperativo' && this.players[1]) this.players[1].sprite = s;
            }
            // common sanity
            p.immobilized = false;
            p.blocking = false; p.wasBlocking = false; p.blockPressTime = 0;
            // NO forzar a 1 HP, mantener la vida actual
            try { s.setActive(true).setVisible(true).setAlpha(1).setDepth(8).setCollideWorldBounds(true); } catch (e) {}
            if (s.body) {
                try {
                    s.body.enable = true;
                    if (s.body.setAllowGravity) s.body.setAllowGravity(true);
                    // ensure collision checks are on
                    if (s.body.checkCollision) {
                        s.body.checkCollision.none = false;
                        s.body.checkCollision.up = s.body.checkCollision.down = s.body.checkCollision.left = s.body.checkCollision.right = true;
                    }
                } catch (e) {}
            }
            // Detach from enemies group if mistakenly included
            try { if (this.enemies && this.enemies.contains && this.enemies.contains(s)) this.enemies.remove(s, false, false); } catch (e) {}
            // Collide with ground
            try {
                if (!this._playerColliders) this._playerColliders = [];
                this._playerColliders.push(this.physics.add.collider(s, this.groundGroup));
            } catch (e) {}
            // Rebind projectile->player overlaps
            try {
                if (!this._projPlayerOverlaps) this._projPlayerOverlaps = [];
                this._projPlayerOverlaps.forEach(c => { try { this.physics.world.removeCollider(c); } catch (e) {} });
                this._projPlayerOverlaps.length = 0;
                this._projPlayerOverlaps.push(this.physics.add.overlap(this.projectiles, this.players[0].sprite, (a, b) => this.handleProjectilePlayerOverlap(a, b, 0)));
                this._projPlayerOverlaps.push(this.physics.add.overlap(this.projectiles, this.players[1].sprite, (a, b) => this.handleProjectilePlayerOverlap(a, b, 1)));
            } catch (e) {}
            // Rebind boss spikes overlap
            try {
                if (this._bossSpikesOverlap) { this.physics.world.removeCollider(this._bossSpikesOverlap); this._bossSpikesOverlap = null; }
                if (this.bossSpikes && this.players[0].sprite) {
                    this._bossSpikesOverlap = this.physics.add.overlap(this.bossSpikes, this.players[0].sprite, (spike, sprite) => {
                        try { spike.destroy(); } catch (e) {}
                        this.applyDamageToPlayer(0, 70);
                    });
                }
            } catch (e) {}
            // Bring visuals to top
            try { if (this.children && this.children.bringToTop) this.children.bringToTop(s); } catch (e) {}
            if (this.reticle) {
                try { if (this.children && this.children.bringToTop) this.children.bringToTop(this.reticle); } catch (e) {}
                try { if (this.reticle.setDepth) this.reticle.setDepth(11); } catch (e) {}
            }
        } catch (e) { /* ignore */ }
    }

    // Energy helpers: support a shared pool in cooperative mode
    getEnergy(player) {
        if (this.mode === 'cooperativo') return (this.sharedEnergy != null) ? this.sharedEnergy : 0;
        return player.energy || 0;
    }

    setEnergyFor(player, value) {
        const v = Math.max(0, Math.min(this.maxEN || 500, value));
        if (this.mode === 'cooperativo') this.sharedEnergy = v;
        else player.energy = v;
    }

    changeEnergyFor(player, delta) {
        const cur = this.getEnergy(player);
        this.setEnergyFor(player, cur + delta);
    }

    // Create invisible platforms/ground for a given map name
    createMapPlatforms(mapName, width, height) {
        // Si es Mapa 2 y tenemos tilemap, no crear plataformas invisibles
        if (mapName === 'Mapa 2' && this._tilemapSueloLayer) {
            console.log('Mapa 2 usa tilemap con texturas, no se crean plataformas invisibles');
            return;
        }
        
        // Instead of creating bodies directly here, store platform data and build from it.
        if (!this._platformData) this._platformData = [];
        this._platformData.length = 0; // clear

        if (mapName === 'Mapa 1') {
            // Create a slight slope by splitting the ground into two segments with different Y

            // Left ground - bajado más
            this._platformData.push({ x: Math.round(width * 0.20), y: Math.round(height * 1.1), w: Math.round(width * 0.56), h: 40 });
            // Right ground - bajado más
            this._platformData.push({ x: Math.round(width * 0.72), y: Math.round(height * 1.1), w: Math.round(width * 0.56), h: 40 });

            // Platforms near the left player - bajadas considerablemente
            // left-most near player - bajada más
            this._platformData.push({ x: Math.round(width * 0.12), y: Math.round(height * 0.88), w: 160, h: 24 });
            // platform above player - bajada más
            this._platformData.push({ x: Math.round(width * 0.32), y: Math.round(height * 0.68), w: 160, h: 24 });

            // Middle platform - bajada más
            this._platformData.push({ x: Math.round(width * 0.58), y: Math.round(height * 1.07), w: 580, h: 90 });

            // Small platform between players - bajada más
            this._platformData.push({ x: Math.round(width * 0.56), y: Math.round(height * 0.71), w: 120, h: 24 });
        } else if (mapName === 'Mapa 2') {
            // Plataformas generadas desde mapa2.JSON capa "suelo"
            // Mapa base: 30x20 tiles, cada tile = 32x32px
            
            // Plataformas superiores flotantes (filas 3-5)
            this._platformData.push({ x: 688, y: 112, w: 32, h: 32 }); // Individual superior
            this._platformData.push({ x: 672, y: 144, w: 64, h: 32 }); // Pequeña flotante
            this._platformData.push({ x: 240, y: 176, w: 32, h: 32 }); // Flotante izq
            this._platformData.push({ x: 336, y: 176, w: 32, h: 32 }); // Flotante centro-izq
            this._platformData.push({ x: 496, y: 176, w: 32, h: 32 }); // Flotante centro
            this._platformData.push({ x: 624, y: 176, w: 96, h: 32 }); // Flotante derecha
            
            // Plataformas medias (filas 6-8)
            this._platformData.push({ x: 288, y: 208, w: 128, h: 32 }); // Media-alta izq
            this._platformData.push({ x: 416, y: 208, w: 128, h: 32 }); // Media-alta centro
            this._platformData.push({ x: 528, y: 208, w: 96, h: 32 }); // Media-alta der
            this._platformData.push({ x: 784, y: 240, w: 224, h: 32 }); // Larga derecha
            this._platformData.push({ x: 672, y: 272, w: 128, h: 32 }); // Media derecha
            
            // Plataformas media-baja (filas 9-12)
            this._platformData.push({ x: 64, y: 304, w: 128, h: 32 }); // Pared izq fila 9
            this._platformData.push({ x: 400, y: 304, w: 160, h: 32 }); // Centro fila 9
            this._platformData.push({ x: 672, y: 304, w: 64, h: 32 }); // Der fila 9
            this._platformData.push({ x: 64, y: 336, w: 128, h: 32 }); // Pared izq fila 10
            this._platformData.push({ x: 224, y: 336, w: 128, h: 32 }); // Centro-izq fila 10
            this._platformData.push({ x: 608, y: 336, w: 128, h: 32 }); // Der fila 10
            this._platformData.push({ x: 64, y: 368, w: 128, h: 32 }); // Pared izq fila 11
            this._platformData.push({ x: 288, y: 368, w: 64, h: 32 }); // Centro fila 11
            this._platformData.push({ x: 576, y: 368, w: 64, h: 32 }); // Der fila 11
            this._platformData.push({ x: 400, y: 400, w: 352, h: 32 }); // Plataforma central larga fila 12
            
            // Suelo y estructuras base (filas 13-19)
            this._platformData.push({ x: 64, y: 432, w: 128, h: 32 }); // Pared izq fila 13
            this._platformData.push({ x: 64, y: 464, w: 128, h: 32 }); // Pared izq fila 14
            this._platformData.push({ x: 64, y: 496, w: 128, h: 32 }); // Pared izq fila 15
            this._platformData.push({ x: 64, y: 528, w: 128, h: 32 }); // Pared izq fila 16
            this._platformData.push({ x: 64, y: 560, w: 128, h: 32 }); // Pared izq fila 17
            this._platformData.push({ x: 64, y: 592, w: 128, h: 32 }); // Pared izq fila 18
            this._platformData.push({ x: 64, y: 624, w: 128, h: 32 }); // Pared izq fila 19 (suelo)
            
            // Columnas y plataforma derecha
            this._platformData.push({ x: 480, y: 464, w: 64, h: 32 }); // Columna fila 14
            this._platformData.push({ x: 480, y: 496, w: 64, h: 32 }); // Columna fila 15
            this._platformData.push({ x: 544, y: 528, w: 192, h: 32 }); // Plataforma derecha fila 16
        } else {
            this._platformData.push({ x: Math.round(width / 2), y: Math.round(height - 30), w: Math.round(width), h: 40 });
        }

        // Build the actual game objects from the data
        this.buildPlatformsFromData();
    }

    // Create static bodies and visuals from this._platformData
    buildPlatformsFromData() {
        // destroy previous groundGroup if present
        if (this.groundGroup) {
            try {
                this.groundGroup.clear(true, true);
            } catch (e) { /* ignore */ }
        }
        this.groundGroup = this.physics.add.staticGroup();
        this._platformObjects = [];

        if (!this._platformData) this._platformData = [];

        this._platformData.forEach((pd, idx) => {
            const rect = this.add.rectangle(pd.x, pd.y, pd.w, pd.h, 0x00ff00, this._platformsVisible ? 0.35 : 0).setOrigin(0.5);
            // add a subtle outline to make edges visible
            try { rect.setStrokeStyle(2, 0x00ff00, this._platformsVisible ? 0.8 : 0); } catch (e) {}
            // render below players but above background
            try { rect.setDepth(6); } catch (e) {}
            this.physics.add.existing(rect, true);
            this.groundGroup.add(rect);
            this._platformObjects.push({ gobj: rect, data: pd });
        });

        // refresh player colliders if players exist
        try {
            if (this._playerColliders && this._playerColliders.length) {
                this._playerColliders.forEach(c => { try { this.physics.world.removeCollider(c); } catch (e) {} });
            }
            this._playerColliders = [];
            if (this.players && this.players[0] && this.players[0].sprite) this._playerColliders.push(this.physics.add.collider(this.players[0].sprite, this.groundGroup));
            if (this.players && this.players[1] && this.players[1].sprite) this._playerColliders.push(this.physics.add.collider(this.players[1].sprite, this.groundGroup));
        } catch (e) { /* ignore collider refresh errors */ }

    // If debug overlay is active, redraw (debug disabled in gameplay)
    }

    // Toggle visibility of invisible platform rectangles
    togglePlatformsVisibility() {
        this._platformsVisible = !this._platformsVisible;
        if (this._platformObjects && this._platformObjects.length) {
            const fillAlpha = this._platformsVisible ? 0.35 : 0;
            const strokeAlpha = this._platformsVisible ? 0.8 : 0;
            this._platformObjects.forEach(obj => {
                const r = obj.gobj;
                try {
                    // update fill and stroke visibility
                    r.setFillStyle(0x00ff00, fillAlpha);
                    r.setStrokeStyle(2, 0x00ff00, strokeAlpha);
                } catch (e) {}
            });
        }
    }

    create() {
        // Detener música de menú e iniciar música de batalla
        stopMenuMusic(this);
        ensureBattleMusic(this);
        
        const { width, height } = this.scale;
        
        // Configurar límites del mundo: quitar el límite inferior para que puedan caer
        this.physics.world.setBounds(0, 0, width, height * 2);
        // Activar solo colisiones en los lados y arriba, no abajo
        this.physics.world.setBoundsCollision(true, true, true, false);
        
        // Try fullscreen on start (may be rejected if not user-gesture). Swallow promise rejection.
        try {
            const fs = this.scale && this.scale.startFullscreen ? this.scale.startFullscreen() : null;
            if (fs && typeof fs.then === 'function' && typeof fs.catch === 'function') {
                fs.catch(err => { /* ignore permission errors like "not granted" */ });
            }
        } catch (e) { /* ignore fullscreen errors */ }

        // Background map image (if selected) - always try to show it: if not loaded, load it at runtime
        // Función para agregar el fondo (usada por ambos mapas)
        const addBgIfReady = (key) => {
            if (!this.textures.exists(key)) return false;
            const bg = this.add.image(0, 0, key);
            // store reference so we can nudge it live
            this._bgImage = bg;
            if (this._bgYOffset === undefined) this._bgYOffset = 0; // sin offset por defecto
            
            // Estirar el fondo para cubrir toda la pantalla (sin mantener proporción)
            try {
                // Usar las dimensiones de la cámara para cubrir todo el viewport
                const camWidth = this.cameras.main.width;
                const camHeight = this.cameras.main.height;
                
                bg.setDisplaySize(camWidth, camHeight);
                bg.setOrigin(0.5, 0.5);
                bg.setPosition(camWidth / 2, camHeight / 2 + (this._bgYOffset || 0));
                bg.setScrollFactor(0);
                bg.setDepth(-10);
            } catch (e) {
                // fallback con width/height del create
                try { 
                    bg.setDisplaySize(width, height); 
                    bg.setOrigin(0.5, 0.5); 
                    bg.x = width / 2; 
                    bg.y = height / 2;
                    bg.setScrollFactor(0);
                    bg.setDepth(-10);
                } catch (ee) { /* ignore */ }
            }
            return true;
        };

        if (this.selectedMap === 'Mapa 1') {
            // If texture already exists (preloaded), add immediately
            if (!addBgIfReady('map1')) {
                // Try to load map1 at runtime. We'll attempt relative path first, then absolute on one retry.
                this._map1InGameRetry = false;
                // once the file finishes loading, add the background
                this.load.once('filecomplete-image-map1', () => { addBgIfReady('map1'); }, this);
                // handle load errors: retry once with absolute path
                this.load.once('loaderror', (file) => {
                    try {
                        if (file && file.key === 'map1' && !this._map1InGameRetry) {
                            this._map1InGameRetry = true;
                            this.load.image('map1', '/mapas/mapaprov.png');
                            // ensure we add when this second attempt completes
                            this.load.once('filecomplete-image-map1', () => { addBgIfReady('map1'); }, this);
                            this.load.start();
                        }
                    } catch (e) { /* ignore */ }
                }, this);
                // start the loader for the first attempt
                this.load.image('map1', 'mapas/mapaprov.png');
                this.load.start();
            }
        }

        // Mapa 2: fondo2.png
        if (this.selectedMap === 'Mapa 2') {
            // If texture already exists (preloaded), add immediately
            if (!addBgIfReady('map2')) {
                // Try to load map2 at runtime
                this._map2InGameRetry = false;
                // once the file finishes loading, add the background
                this.load.once('filecomplete-image-map2', () => { addBgIfReady('map2'); }, this);
                // handle load errors: retry once with absolute path
                this.load.once('loaderror', (file) => {
                    try {
                        if (file && file.key === 'map2' && !this._map2InGameRetry) {
                            this._map2InGameRetry = true;
                            this.load.image('map2', '/mapas/fondo2.png');
                            // ensure we add when this second attempt completes
                            this.load.once('filecomplete-image-map2', () => { addBgIfReady('map2'); }, this);
                            this.load.start();
                        }
                    } catch (e) { /* ignore */ }
                }, this);
                // start the loader for the first attempt
                this.load.image('map2', 'mapas/fondo2.png');
                this.load.start();
            }
            
            // Crear tilemap con texturas del Tileset.png
            if (this.cache.tilemap.has('mapa2') && this.textures.exists('tileset_mapa2')) {
                try {
                    // Crear el tilemap desde el JSON (ahora con tileset embebido)
                    const map = this.make.tilemap({ key: 'mapa2' });
                    
                    // Ahora el tileset está embebido en el JSON con el nombre "Tileset"
                    const tileset = map.addTilesetImage('Tileset', 'tileset_mapa2');
                    
                    // Intentar agregar el tileset con diferentes nombres posibles
                    const possibleNames = ['Tileset', 'tileset', '1', 'tiled'];
                    
                    if (tileset) {
                        console.log('Tileset cargado correctamente');
                        // Crear las capas del mapa
                        // Capa de fondo (decoración sin colisión)
                        try {
                            const fondoLayer = map.createLayer('fondo', tileset, 0, 0);
                            if (fondoLayer) fondoLayer.setDepth(-5);
                        } catch (e) {
                            console.warn('No se pudo crear capa fondo:', e);
                        }
                        
                        // Capa de decoración
                        try {
                            const decoracionLayer = map.createLayer('decoracion', tileset, 0, 0);
                            if (decoracionLayer) decoracionLayer.setDepth(0);
                        } catch (e) {
                            console.warn('No se pudo crear capa decoracion:', e);
                        }
                        
                        // Capa de suelo (con colisión)
                        try {
                            const sueloLayer = map.createLayer('suelo', tileset, 0, 0);
                            if (sueloLayer) {
                                sueloLayer.setDepth(1);
                                // Configurar colisión: todos los tiles que NO sean 0 (vacío) tienen colisión
                                sueloLayer.setCollisionByExclusion([-1]);
                                
                                // Guardar referencia para agregar colisiones después de crear jugadores
                                this._tilemapSueloLayer = sueloLayer;
                                console.log('Capa de suelo creada con colisiones');
                            }
                        } catch (e) {
                            console.error('Error al crear capa suelo:', e);
                        }
                        
                        // Guardar referencia al mapa
                        this._tilemap = map;
                        
                        console.log('Mapa 2 con texturas cargado correctamente');
                    } else {
                        console.error('No se pudo agregar el tileset al mapa');
                    }
                } catch (error) {
                    console.error('Error al crear tilemap del Mapa 2:', error);
                }
            } else {
                console.warn('No se encontró mapa2 o tileset_mapa2');
            }
        }

        // Debug controls: allow nudging background vertically with [ and ] keys
        // show current offset on screen
        this.input.keyboard.on('keydown-OPEN_BRACKET', () => {
            this._bgYOffset = (this._bgYOffset || 0) - 8;
            if (this._bgImage) this._bgImage.y = this._bgImage.y - 8;
            if (this._bgOffsetText) this._bgOffsetText.setText(`bg offset: ${this._bgYOffset}`);
        });
        this.input.keyboard.on('keydown-CLOSE_BRACKET', () => {
            this._bgYOffset = (this._bgYOffset || 0) + 8;
            if (this._bgImage) this._bgImage.y = this._bgImage.y + 8;
            if (this._bgOffsetText) this._bgOffsetText.setText(`bg offset: ${this._bgYOffset}`);
        });
        // fallback key names for some browsers
        this.input.keyboard.on('keydown-[', () => { this.input.keyboard.emit('keydown-OPEN_BRACKET'); });
        this.input.keyboard.on('keydown-]', () => { this.input.keyboard.emit('keydown-CLOSE_BRACKET'); });

        this._bgOffsetText = this.add.text(10, 10, `bg offset: ${this._bgYOffset || 0}`, { font: '16px Arial', color: '#ffffff' }).setDepth(1000).setScrollFactor(0);

        // Listener para redimensionar el fondo cuando cambie el tamaño de la ventana/pantalla completa
        this.scale.on('resize', (gameSize) => {
            if (this._bgImage) {
                const newWidth = gameSize.width;
                const newHeight = gameSize.height;
                this._bgImage.setDisplaySize(newWidth, newHeight);
                this._bgImage.setPosition(newWidth / 2, newHeight / 2 + (this._bgYOffset || 0));
            }
        });

        // Platform debug tools removed for gameplay stability
        this._debugMode = false;
        this._selectedPlatformIndex = 0;
        // NOTE: editing and visualizing platforms at runtime has been disabled.

        // Create invisible ground and platforms depending on selected map
        this.groundGroup = this.physics.add.staticGroup();
        // visibility flag for debug/invisible platforms (default false)
        if (typeof this._platformsVisible !== 'boolean') this._platformsVisible = false;
        this.createMapPlatforms(this.selectedMap, width, height);

        // Toggle platforms visibility on 'U'
        try {
            this.input.keyboard.on('keydown-U', () => this.togglePlatformsVisibility());
        } catch (e) { /* ignore */ }

        // Platform debug showing removed to prevent accidental runtime edits during gameplay

        // Players array with state
        this.players = [];

    // Create character sprites based on selected indices (player1Index, player2Index)
    const p1KeyBase = `char${this.player1Index}_idle`;
    const p2KeyBase = `char${this.player2Index}_idle`;
    
    // Verificar que las texturas existen antes de crear los sprites
    if (!this.textures.exists(p1KeyBase)) {
        console.error(`Texture ${p1KeyBase} does not exist. Returning to character selector.`);
        this.scene.stop();
        this.scene.start('CharacterSelector', { mode: this.mode });
        return;
    }
    if (!this.textures.exists(p2KeyBase)) {
        console.error(`Texture ${p2KeyBase} does not exist. Returning to character selector.`);
        this.scene.stop();
        this.scene.start('CharacterSelector', { mode: this.mode });
        return;
    }
    
    const spawnY = (this.selectedMap === 'Mapa 1') ? (height - 20) : (height - 40);
    const p1Sprite = this.physics.add.sprite(200, spawnY, p1KeyBase).setCollideWorldBounds(true);
    const p2Sprite = this.physics.add.sprite(width - 200, spawnY, p2KeyBase).setCollideWorldBounds(true);
    // Ensure players render above enemies/boss/spikes (boss depth=5, spikes=4)
    try { p1Sprite.setDepth(8); p2Sprite.setDepth(8); } catch (e) {}

        [p1Sprite, p2Sprite].forEach(s => {
            s.setBounce(0.05);
            // force display size to 64x64 (sprites are 64x64 tiles)
            try { s.setDisplaySize(64, 64); } catch (e) { /* ignore if not supported */ }
            // adjust body size for 64x64 frames
            if (s.body && s.body.setSize) s.body.setSize(40, 56).setOffset(12, 8);
            // start idle animation if exists - play the anim only if it's intended to animate; otherwise show first frame
            const animKey = `${s.texture.key}`;
            // Do NOT autoplay the idle animation on spawn. Show the first frame only.
            // Animations will be started by the update loop when input/actions occur.
            try { s.setFrame(0); } catch (e) { /* ignore */ }
        });

        // Cambios: vida 1000, energía 500, contador de golpes y flag de daño
        this.players.push({
            sprite: p1Sprite, health: 1000, energy: 500, blocking: false,
            secondHealth: 500, // coop: secondary life pool (half)
            immobilized: false,
            chargingShot: false,
            chargeAmount: 0,
            lastShot: 0, lastPunch: 0, shotCD: 400, punchCD: 350, padIndex: 0,
            hitCount: 0, beingHit: false, hitTimer: 0,
            specialBuffer: [],
            specialActive: false,
            specialTimer: 0,
            transformed: false,
            transformTimer: 0,
            transformBuffer: [],
            transformActive: false,
            explosionBuffer: [],
            explosionPending: false,
            explosionTimer: 0,
            franchescaEnergyBuffer: [],
            franchescaEnergyActive: false,
            franchescaEnergyTimer: 0,
            sofiaLaserBuffer: [],
            sofiaTeleportBuffer: [],
            sofiaMeteorBuffer: [],
            franchescaJumpBuffer: [],
            franchescaJumpPending: false,
            franchescaJumpTimer: 0,
            // propiedades para la habilidad de robo de Franchesca (iniciales)
            franchescaLaserBuffer: [],
            franchescaStolenAbility: null,       // { name, cost, source, timer }
            franchescaStolenTimer: 0,
            stolenAbilities: {},                  // { abilityName: true }
            stolenAbilitiesTimers: {},            // { abilityName: timestamp }
           
            franchescaUseBuffer: []               // buffer para usar habilidad robada (L,L,X)
        });

        this.players.push({
            sprite: p2Sprite, health: 1000, energy: 500, blocking: false,
            secondHealth: 500,
            immobilized: false,
            chargingShot: false,
            chargeAmount: 0,
            lastShot: 0, lastPunch: 0, shotCD: 400, punchCD: 350, padIndex: 1,
            hitCount: 0, beingHit: false, hitTimer: 0,
            specialBuffer: [], // Para secuencia de botones
            specialActive: false,
            specialTimer: 0,
            transformed: false,
            transformTimer: 0,
            transformBuffer: [],
            transformActive: false,
            explosionBuffer: [],
            explosionPending: false,
            explosionTimer: 0,
            franchescaEnergyBuffer: [],
            franchescaEnergyActive: false,
            franchescaEnergyTimer: 0,
            sofiaLaserBuffer: [],
            sofiaTeleportBuffer: [],
            sofiaMeteorBuffer: [],
            franchescaJumpBuffer: [],
            franchescaJumpPending: false,
            franchescaJumpTimer: 0,
            // propiedades para la habilidad de robo de Franchesca (iniciales)
            franchescaLaserBuffer: [],
            franchescaStolenAbility: null,
            franchescaStolenTimer: 0,
            stolenAbilities: {},
            stolenAbilitiesTimers: {},
            franchescaUseBuffer: []
        });

        // Colliders
    // Colliders: players with groundGroup (invisible platforms)
    this.physics.add.collider(this.players[0].sprite, this.groundGroup);
    
    // Si usamos tilemap en Mapa 2, agregar colisiones con la capa de suelo
    if (this._tilemapSueloLayer) {
        this.physics.add.collider(this.players[0].sprite, this._tilemapSueloLayer);
        console.log('Colisión agregada entre jugador 1 y tilemap');
    }
    
    // If coop mode, share the same sprite between players and create reticle
    if (this.mode === 'cooperativo') {
        // Hide and disable the original p2Sprite since we'll use p1's sprite
        p2Sprite.setVisible(false);
        p2Sprite.setActive(false);
        // Make player2 reference the same sprite as player1
        this.players[1].sprite = this.players[0].sprite;
        // Create a reticle that orbits around the single player
        try {
            if (this.textures.exists('target')) {
                this.reticle = this.add.image(this.players[0].sprite.x, this.players[0].sprite.y + 48, 'target');
            } else {
                this.reticle = this.add.circle(this.players[0].sprite.x, this.players[0].sprite.y + 48, 8, 0xffff00);
            }
            this.physics.add.existing(this.reticle);
            if (this.reticle.body) this.reticle.body.setAllowGravity(false);
            try { this.reticle.setDepth(11); } catch (e) {}
        } catch (e) { /* ignore */ }
    } else {
        this.physics.add.collider(this.players[1].sprite, this.groundGroup);
        
        // Si usamos tilemap en Mapa 2, agregar colisiones con jugador 2
        if (this._tilemapSueloLayer) {
            this.physics.add.collider(this.players[1].sprite, this._tilemapSueloLayer);
            console.log('Colisión agregada entre jugador 2 y tilemap');
        }
    }

    // Projectiles group (sin gravedad por defecto)
    this.projectiles = this.physics.add.group({ allowGravity: false });

        // Projectile -> players overlap
        this.physics.add.overlap(
            this.projectiles,
            this.players[0].sprite,
            (a, b) => this.handleProjectilePlayerOverlap(a, b, 0)
        );
        this.physics.add.overlap(
            this.projectiles,
            this.players[1].sprite,
            (a, b) => this.handleProjectilePlayerOverlap(a, b, 1)
        );

        // Barras más largas
        const barY = 30;
        const barLength = 400;
        this.hpBars = [
            this.add.rectangle(150, barY, barLength, 18, 0xff0000).setOrigin(0, 0.5),
            this.add.rectangle(this.scale.width - 150, barY, barLength, 18, 0xff0000).setOrigin(1, 0.5)
        ];
        this.enBars = [
            this.add.rectangle(150, barY + 28, barLength, 12, 0x00ccff).setOrigin(0, 0.5),
            this.add.rectangle(this.scale.width - 150, barY + 28, barLength, 12, 0x00ccff).setOrigin(1, 0.5)
        ];

        // If cooperative mode: hide right-side player bars and add a small secondary HP bar below the main bar
        if (this.mode === 'cooperativo') {
            try {
                if (this.hpBars[1]) this.hpBars[1].setVisible(false);
                if (this.enBars[1]) this.enBars[1].setVisible(false);
            } catch (e) {}
            // small secondary HP bar under main player 1 bars (half-life representation)
            const smallWidth = barLength / 2;
            this.smallHPBar = this.add.rectangle(150, barY + 46, smallWidth, 10, 0xff8800).setOrigin(0, 0.5);
            this.smallHPBar.max = smallWidth;
            // initialize shared energy pool for coop
            this.maxEN = 500;
            this.sharedEnergy = this.maxEN;
        }

        // Keyboard controls
        this.keysP1 = this.input.keyboard.addKeys({
            up: "W", left: "A", right: "D", down: "S",
            hit: "X", block: "C", charge: "V", shoot: "B"
        });
        this.keysP2 = this.input.keyboard.addKeys({
            up: "UP", left: "LEFT", right: "RIGHT", down: "DOWN",
            hit: "K", block: "L", charge: "O", shoot: "P"
        });

        // DEBUG: tecla T salta directo al jefe final en modo cooperativo
        try {
            this.input.keyboard.on('keydown-T', () => {
                if (this.mode !== 'cooperativo') return;
                // cancelar futuros spawns de oleadas
                this._cancelWaveSpawns = true;
                // limpiar enemigos y proyectiles enemigos actuales
                try { if (this.enemies) this.enemies.clear(true, true); } catch (e) {}
                try { if (this.enemyProjectiles) this.enemyProjectiles.clear(true, true); } catch (e) {}
                // preparar estado para jefe
                this.currentWave = this.maxWaves;
                this.waveActive = false;
                this.waveCompleted = true;
                if (this.boss) { try { this.boss.destroy(); } catch (e) {} }
                this.boss = null; this.bossActive = false;
                if (this.waveText && this.waveText.setText) this.waveText.setText('¡Jefe final! (debug)');
                // Saneamiento: asegurar sprite válido/activo y rebind de overlaps
                try { this.ensurePlayerSpriteValid(); if (this.physics && this.physics.world && this.physics.world.isPaused) this.physics.resume(); } catch (ee) { /* ignore */ }
                // spawn boss inmediatamente
                this.spawnBoss();
            });
        } catch (e) { /* ignore debug key errors */ }

        // Gamepad connect listener: initialize flags
        this.input.gamepad.on('connected', pad => {
            pad._leftPressed = pad._rightPressed = false;
            pad._aPressed = pad._bPressed = false;
            pad._lastButtons = [];
        });

        // Sistema de oleadas para modo cooperativo
        if (this.mode === 'cooperativo') {
            this.currentWave = 0;
            this.maxWaves = 5;
            this.enemies = this.physics.add.group();
            // Grupo de proyectiles enemigos (sin gravedad por defecto)
            this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
            this.waveActive = false;
            this.waveCompleted = false;
            // Boss state
            this.boss = null;
            this.bossActive = false;
            this.bossSpikes = this.physics.add.staticGroup();
            
            // Configuración de oleadas: número de enemigos por oleada
            this.waveConfig = [
                { enemies: 3 },  // Oleada 1
                { enemies: 5 },  // Oleada 2
                { enemies: 7 },  // Oleada 3
                { enemies: 9 },  // Oleada 4
                { enemies: 12 }  // Oleada 5
            ];
            
            // Texto de oleada
            this.waveText = this.add.text(this.scale.width / 2, 100, '', {
                fontSize: '32px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(1000).setScrollFactor(0);
            
            // Iniciar primera oleada después de 2 segundos
            this.time.delayedCall(2000, () => this.startWave());
            
            // Colisiones: proyectiles enemigos con jugador (bloqueables con parry perfecto)
            this.physics.add.overlap(
                this.enemyProjectiles,
                this.players[0].sprite,
                (a, b) => {
                    // Determinar el proyectil con seguridad
                    const proj = (a && a.texture && a.texture.key === 'tex_bullet') ? a : b;
                    if (!proj || !proj.active) return;
                    const shooterIndex = 1; // En coop, P2 es el que dispara/parrea
                    const p = this.players[shooterIndex];
                    const now = this.time.now;
                    const parryWindow = 500;
                    const justBlocked = p.blockPressTime && (now - p.blockPressTime) < parryWindow;
                    if (p.blocking && justBlocked && !proj.parried) {
                        proj.parried = true;
                        proj.damage = (proj.damage || 35) * 2;
                        proj.isReflected = true;
                        proj.parryReflected = true;
                        try { proj.setTint(0xff00ff); } catch (e) {}
                        this.cameras.main.flash(120, 255, 255, 0);
                        if (proj.body) {
                            const vx = proj.body.velocity.x || 0;
                            const vy = proj.body.velocity.y || 0;
                            let speed = Math.hypot(vx, vy);
                            let angle;
                            if (speed > 10) {
                                angle = Math.atan2(-vy, -vx);
                            } else {
                                const px = this.players[0].sprite.x;
                                const py = this.players[0].sprite.y;
                                angle = Phaser.Math.Angle.Between(proj.x, proj.y, px, py) + Math.PI;
                                speed = 600;
                            }
                            const newSpeed = Math.max(500, speed);
                            const newVx = Math.cos(angle) * newSpeed;
                            const newVy = Math.sin(angle) * newSpeed;
                            proj.body.setAllowGravity(false);
                            if (proj.body.setGravity) proj.body.setGravity(0, 0);
                            proj.body.setDrag(0, 0);
                            proj.body.setVelocity(newVx, newVy);
                            proj.rotation = angle;
                        }
                        proj.shooter = shooterIndex;
                        this.enemyProjectiles.remove(proj, true, false);
                        this.projectiles.add(proj, true);
                        if (proj.body) {
                            // Reasegurar configuración tras cambio de grupo
                            proj.body.setAllowGravity(false);
                            if (proj.body.setGravity) proj.body.setGravity(0, 0);
                            proj.body.setDrag(0, 0);
                            if (proj.body.velocity.length && proj.body.velocity.length() < 10) {
                                // Si perdió velocidad, usar su rotación para impulsarlo
                                const speed = 600;
                                const ang = proj.rotation || 0;
                                proj.body.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
                            }
                        }
                        return; // no continuar con lógica de daño al jugador
                    }
                    if (p.blocking) {
                        this.changeEnergyFor(p, -10);
                        try { proj.destroy(); } catch (e) {}
                        return;
                    }
                    this.applyDamageToPlayer(0, proj.damage || 35);
                    try { proj.destroy(); } catch (e) {}
                }
            );

            // Colisión: pinchos del jefe con el jugador (no bloqueables)
            this.physics.add.overlap(this.bossSpikes, this.players[0].sprite, (spike, sprite) => {
                try { spike.destroy(); } catch(e) {}
                this.applyDamageToPlayer(0, 70);
            });
            
            // Colisiones: proyectiles del jugador con enemigos (con reflexión para enemigos terrestres)
            this.physics.add.overlap(this.projectiles, this.enemies, (proj, enemy) => {
                if (!proj.active || !enemy.active) return;

                // Si el enemigo refleja proyectiles del jugador Y NO es un proyectil de parry, devuélvelo hacia el jugador
                if (enemy.reflectsProjectiles && !proj.isReflected && !proj.parryReflected) {
                    proj.isReflected = true;
                    try { proj.setTint(0x66ccff); } catch (e) { /* visual */ }
                    
                    // Reproducir animación de ataque al desviar
                    if (enemy.texture && enemy.texture.key === 'ground_enemy_walk' && this.anims.exists('ground_enemy_attack')) {
                        enemy.play('ground_enemy_attack');
                        // Volver a caminar después de la animación
                        enemy.once('animationcomplete', () => {
                            if (enemy.active && this.anims.exists('ground_enemy_walk')) {
                                enemy.play('ground_enemy_walk');
                            }
                        });
                    }

                    const playerSprite = this.players[0] && this.players[0].sprite;
                    if (playerSprite && proj.body) {
                        const ang = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerSprite.x, playerSprite.y);
                        // Mantener la velocidad actual si existe, sino usar 500
                        const curVx = proj.body.velocity.x || 0;
                        const curVy = proj.body.velocity.y || 0;
                        const curSpeed = Math.max(300, Math.hypot(curVx, curVy));
                        proj.body.setVelocity(Math.cos(ang) * curSpeed, Math.sin(ang) * curSpeed);
                        proj.rotation = ang;
                        // Asegurar que no se trate como fuego amigo
                        proj.shooter = -1;
                    }
                    // No dañar al enemigo
                    return;
                }

                // Si el proyectil fue reflejado por parry, siempre daña al enemigo (ignora reflexión enemiga)
                let damage = proj.damage || 20;
                if (proj.parryReflected) {
                    // Proyectil de parry perfecto: siempre hace daño completo y doble
                    damage = proj.damage; // Ya tiene el daño duplicado
                    console.log('Parry hit enemy with damage:', damage);
                }
                if (enemy === this.boss) {
                    enemy.health -= damage;
                    console.log('Boss health after parry hit:', enemy.health);
                } else {
                    enemy.health -= damage;
                    console.log('Enemy health after parry hit:', enemy.health);
                }
                proj.destroy();

                if (enemy.health <= 0) {
                    if (enemy.healthBar) enemy.healthBar.destroy();
                    if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                    enemy.destroy();
                    this.checkWaveComplete();
                }
            });
        }

    // small camera shake on hit
    // background color removed to allow map background to show
    }

    onProjectileHit(proj, hitPlayerIndex) {
        // soporte para proyectiles variados; usa proj.damage / proj.piercing
        if (!proj || !proj.active || !proj.texture) return;
    const key = proj.texture.key;
    if (key !== 'tex_bullet' && key !== 'charles_bullet' && key !== 'sofia_bullet') return; // soporta bala de Charles y Sofía
        const shooter = proj.shooter;
        if (shooter === hitPlayerIndex) return;
        const target = this.players[hitPlayerIndex];
        if (!target) { if (!proj.piercing) proj.destroy(); return; }

        // Bloqueo: si el jugador está bloqueando, anula el impacto (aplica pequeño coste de energía)
        if (target.blocking) {
            this.changeEnergyFor(target, -10);
            if (!proj.piercing) {
                if (key === 'charles_bullet' && this.anims.exists('charles_bullet_impact') && !proj._impacting) {
                    proj._impacting = true;
                    try { if (proj.body) { proj.body.setVelocity(0, 0); proj.body.enable = false; } } catch (e) {}
                    try { proj.play('charles_bullet_impact'); } catch (e) {}
                    proj.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { try { proj.destroy(); } catch (e) {} });
                } else if (key === 'sofia_bullet' && this.anims.exists('sofia_bullet_impact') && !proj._impacting) {
                    proj._impacting = true;
                    try { if (proj.body) { proj.body.setVelocity(0, 0); proj.body.enable = false; } } catch (e) {}
                    try { proj.play('sofia_bullet_impact'); } catch (e) {}
                    proj.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { try { proj.destroy(); } catch (e) {} });
                } else {
                    proj.destroy();
                }
            }
            return;
        }

        const damage = (proj.damage != null) ? proj.damage : 20;

        // In cooperative mode, avoid damaging the shared player (friendly fire)
        if (this.mode === 'cooperativo') {
            const shooterSprite = this.players[proj.shooter] && this.players[proj.shooter].sprite;
            const hitSprite = target && target.sprite;
            if (shooterSprite && hitSprite && shooterSprite === hitSprite) {
                // friendly projectile - ignore
                if (!proj.piercing) proj.destroy();
                return;
            }
        }

    // Delegate damage handling to central helper (handles secondary HP in coop)
        this.applyDamageToPlayer(hitPlayerIndex, damage);

        if (!proj.piercing) {
            if (key === 'charles_bullet' && this.anims.exists('charles_bullet_impact') && !proj._impacting) {
                proj._impacting = true;
                try { if (proj.body) { proj.body.setVelocity(0, 0); proj.body.enable = false; } } catch (e) {}
                try { proj.play('charles_bullet_impact'); } catch (e) {}
                proj.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { try { proj.destroy(); } catch (e) {} });
            } else if (key === 'sofia_bullet' && this.anims.exists('sofia_bullet_impact') && !proj._impacting) {
                proj._impacting = true;
                try { if (proj.body) { proj.body.setVelocity(0, 0); proj.body.enable = false; } } catch (e) {}
                try { proj.play('sofia_bullet_impact'); } catch (e) {}
                proj.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { try { proj.destroy(); } catch (e) {} });
            } else {
                proj.destroy();
            }
        }
    }

    handleProjectilePlayerOverlap(a, b, hitPlayerIndex) {
        // Detecta cuál es la bala y cuál el jugador
        let proj;
    const isProjA = a && a.texture && (a.texture.key === 'tex_bullet' || a.texture.key === 'charles_bullet' || a.texture.key === 'sofia_bullet');
    const isProjB = b && b.texture && (b.texture.key === 'tex_bullet' || b.texture.key === 'charles_bullet' || b.texture.key === 'sofia_bullet');
        if (isProjA) proj = a;
        else if (isProjB) proj = b;
        else return; // Ninguno es proyectil compatible
        // Si es un proyectil reflejado por parry, ignorar colisión con jugadores
        if (proj && proj.parryReflected) return;
        this.onProjectileHit(proj, hitPlayerIndex);
    }

    // Central damage application helper. Handles cooperative secondary HP, immobilization and visual flags.
    applyDamageToPlayer(targetIndex, damage) {
        const target = this.players[targetIndex];
        if (!target) return;

        // In cooperative mode we prefer draining main health first, then secondary pool
        if (this.mode === 'cooperativo') {
            if (target.health > 0) {
                // subtract from main health
                const prev = target.health;
                target.health = Math.max(0, target.health - damage);
                target.beingHit = true;
                target.hitTimer = this.time.now + 300;
                // if main just reached 0, set immobilized flag
                if (prev > 0 && target.health === 0) {
                    target.immobilized = true;
                    // provide small feedback
                    this.cameras.main.flash(160, 255, 120, 120);
                }
            } else {
                // drain secondary pool
                target.secondHealth = Math.max(0, (target.secondHealth || 0) - damage);
                target.beingHit = true;
                target.hitTimer = this.time.now + 300;
            }
        } else {
            // normal mode: direct to main health
            target.health = Math.max(0, target.health - damage);
            target.beingHit = true;
            target.hitTimer = this.time.now + 300;
        }
    }

    update(time) {
        // Update enemies in cooperative mode
        if (this.mode === 'cooperativo') {
            this.updateEnemies(time);
            this.updateBoss(time);
        }
        // Track last known player position and reinforce sprite validity during boss phase
        try {
            if (this.players && this.players[0] && this.players[0].sprite) {
                this._lastPlayerX = this.players[0].sprite.x;
                this._lastPlayerY = this.players[0].sprite.y;
            }
            if (this.bossActive) {
                this.ensurePlayerSpriteValid();
            }
        } catch (e) { /* ignore */ }

        for (let i = 0; i < 2; i++) {
            // Si está siendo golpeado, verifica si ya terminó el stun
            if (this.players[i].beingHit && time > this.players[i].hitTimer) {
                this.players[i].beingHit = false;
            }
            // Daño constante por bloqueo si corresponde
            const p = this.players[i];
            if (p.blockingDamageEnd && time < p.blockingDamageEnd) {
                const dt = this.game.loop.delta / 1000;
                p.health = Math.max(0, p.health - (p.blockingDamagePerSecond || 0) * dt);
            } else {
                p.blockingDamageEnd = null;
                p.blockingDamagePerSecond = 0;
            }
            this.updatePlayerInput(i, time);
        }

        // Check for game over (any player's health reaches 0) with a short cooldown so it can fire every match
        const now = time || this.time.now;
        if (now > (this._gameOverCooldownUntil || 0)) {
            if (this.mode === 'cooperativo') {
                // in coop we use the secondary pool: game over only when secondary pool depleted
                const p0 = this.players[0];
                if (p0 && (p0.secondHealth || 0) <= 0) {
                    this._gameOverCooldownUntil = now + 1000;
                    // Limpiar barras de vida del jefe si existen
                    if (this.bossHealthBarBg) { this.bossHealthBarBg.destroy(); this.bossHealthBarBg = null; }
                    if (this.bossHealthBar) { this.bossHealthBar.destroy(); this.bossHealthBar = null; }
                    if (this.bossHealthText) { this.bossHealthText.destroy(); this.bossHealthText = null; }
                    // treat player 1 as loser for payload; in coop both lose
                    try {
                        this.scene.launch('GameOver', {
                        winnerIndex: -1,
                        winnerChar: (this.player1Index || 0),
                        player1Index: this.player1Index,
                        player2Index: this.player2Index,
                        mode: this.mode
                        });
                    } catch (e) { console.warn('Failed to launch GameOver scene (coop):', e); }
                    try { this.scene.stop(); } catch (e) { console.warn('Failed to stop current scene after launching GameOver (coop):', e); }
                }
            } else {
                if (this.players[0].health <= 0 || this.players[1].health <= 0) {
                    const loser = (this.players[0].health <= 0) ? 0 : 1;
                    const winner = 1 - loser;
                    // set cooldown 1s to avoid double-trigger
                    this._gameOverCooldownUntil = now + 1000;
                    // launch GameOver and stop this scene
                    try {
                        this.scene.launch('GameOver', {
                        winnerIndex: winner,
                        winnerChar: (winner === 0) ? this.player1Index : this.player2Index,
                        player1Index: this.player1Index,
                        player2Index: this.player2Index,
                        mode: this.mode
                        });
                    } catch (e) { console.warn('Failed to launch GameOver scene:', e); }
                    try { this.scene.stop(); } catch (e) { console.warn('Failed to stop current scene after launching GameOver:', e); }
                }
            }
        }

        // Barras ajustadas a vida/energía máxima
    const maxHP = 1000, maxEN = this.maxEN || 500, barLength = 400;
    this.hpBars[0].width = Math.max(0, (this.players[0].health / maxHP) * barLength);
    // energy bar: use shared pool in coop, otherwise per-player
    const en0 = (this.mode === 'cooperativo') ? (this.sharedEnergy || 0) : this.players[0].energy;
    this.enBars[0].width = Math.max(0, (en0 / maxEN) * barLength);
        if (this.mode === 'cooperativo') {
            // hide/disable right bars and update small secondary HP bar
            try {
                if (this.hpBars[1]) this.hpBars[1].setVisible(false);
                if (this.enBars[1]) this.enBars[1].setVisible(false);
                const sec = this.players[0].secondHealth || 0;
                const maxSec = 500; // second pool max
                if (this.smallHPBar) this.smallHPBar.width = Math.max(0, (sec / maxSec) * this.smallHPBar.max);
            } catch (e) { /* ignore UI errors */ }
        } else {
            this.hpBars[1].width = Math.max(0, (this.players[1].health / maxHP) * barLength);
            this.enBars[1].width = Math.max(0, (this.players[1].energy / maxEN) * barLength);
        }

        this.projectiles.children.iterate(proj => {
            if (!proj) return;
            if (proj.x < -50 || proj.x > this.scale.width + 50) proj.destroy();
        });

        // Manejo expiraciones de robos y la habilidad robada
        for (let i = 0; i < 2; i++) {
            const p = this.players[i];
            if (!p) continue;

            // 1) Si este jugador tenía una habilidad robada (es ladrón), expirar su habilidad robada
                if (p.franchescaStolenAbility && time > p.franchescaStolenAbility.timer) {
                p.franchescaStolenAbility = null;
                p.franchescaStolenTimer = 0;
                // opcional: feedback - restaurar colores originales
                if (p.sprite && p.sprite.clearTint) p.sprite.clearTint();
                this.cameras.main.flash(120, 200, 255, 200);
            }

            // 2) Revisar habilidades específicas robadas del jugador (si le robaron)
            for (const abilityName in p.stolenAbilitiesTimers) {
                if (p.stolenAbilitiesTimers[abilityName] && time > p.stolenAbilitiesTimers[abilityName]) {
                    delete p.stolenAbilities[abilityName];
                    delete p.stolenAbilitiesTimers[abilityName];
                    // si ya no tiene habilidades robadas, restaurar tint
                    if (p.sprite && Object.keys(p.stolenAbilities).length === 0) {
                        // Restaurar colores originales
                        if (p.sprite.clearTint) p.sprite.clearTint();
                        this.cameras.main.flash(120, 255, 255, 255);
                    }
                }
            }
        }
    }

    updatePlayerInput(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        if (!sprite || !sprite.body) return;

        // Character index for animation keys
        const charIndex = (i === 0) ? this.player1Index : this.player2Index;

        // Mantener overlays pegados al personaje (p.ej., disparo de Sofía)
        if (player.shootOverlay && player.shootOverlay.active) {
            try {
                player.shootOverlay.x = sprite.x;
                player.shootOverlay.y = sprite.y;
                player.shootOverlay.flipX = sprite.flipX;
                if (player.shootOverlay.setDepth) player.shootOverlay.setDepth((sprite.depth || 0) + 1);
            } catch (e) { /* ignore */ }
        }
        // Mantener overlay de caminar pegado al personaje
        if (player.walkOverlay && player.walkOverlay.active) {
            try {
                player.walkOverlay.x = sprite.x;
                player.walkOverlay.y = sprite.y;
                player.walkOverlay.flipX = sprite.flipX;
                if (player.walkOverlay.setDepth) player.walkOverlay.setDepth((sprite.depth || 0) + 1);
            } catch (e) { /* ignore */ }
        }
        // Mantener overlay de golpe pegado al personaje
        if (player.punchOverlay && player.punchOverlay.active) {
            try {
                player.punchOverlay.x = sprite.x;
                player.punchOverlay.y = sprite.y;
                player.punchOverlay.flipX = sprite.flipX;
                if (player.punchOverlay.setDepth) player.punchOverlay.setDepth((sprite.depth || 0) + 1);
            } catch (e) { /* ignore */ }
        }
        // Mantener overlay de bloqueo pegado al personaje
        if (player.blockOverlay && player.blockOverlay.active) {
            try {
                player.blockOverlay.x = sprite.x;
                player.blockOverlay.y = sprite.y;
                player.blockOverlay.flipX = sprite.flipX;
                if (player.blockOverlay.setDepth) player.blockOverlay.setDepth((sprite.depth || 0) + 1);
            } catch (e) { /* ignore */ }
        }
        // Mantener overlay de carga pegado al personaje
        if (player.chargeOverlay && player.chargeOverlay.active) {
            try {
                player.chargeOverlay.x = sprite.x;
                player.chargeOverlay.y = sprite.y;
                player.chargeOverlay.flipX = sprite.flipX;
                if (player.chargeOverlay.setDepth) player.chargeOverlay.setDepth((sprite.depth || 0) + 1);
            } catch (e) { /* ignore */ }
        }

        // Si está siendo golpeado, reproducir animación de 'hurt' y no permitir acciones
        if (player.beingHit) {
            sprite.setVelocityX(0);
            sprite.setTint(0xff4444); // Color de daño
            const hurtKey = `char${charIndex}_hurt`;
            if (this.anims.exists(hurtKey) && sprite.anims.currentAnim?.key !== hurtKey) {
                sprite.play(hurtKey, false);
            }
            return;
        } else {
            // limpiar tint cuando no está siendo golpeado
            if (sprite.clearTint) sprite.clearTint();
        }

        const pad = getPad(player.padIndex, this);

        // CARGA DE ENERGÍA COOPERATIVA: verificar si ambos jugadores están bloqueando con A
        if (this.mode === 'cooperativo') {
            const p1 = this.players[0];
            const p2 = this.players[1];
            const p1Pad = getPad(p1.padIndex, this);
            const p2Pad = getPad(p2.padIndex, this);
            const p1Block = p1Pad && p1Pad.connected && p1Pad.buttons[0] && p1Pad.buttons[0].pressed;
            const p2Block = p2Pad && p2Pad.connected && p2Pad.buttons[0] && p2Pad.buttons[0].pressed;
            if (p1Block && p2Block) {
                // Ambos están bloqueando con A: recargar energía
                this.changeEnergyFor(player, 2.0);
            }
        }

        // CO-OP: player index 1 does not move the shared character; they control the reticle and shooting
        // If the main player is immobilized (secondary HP depleted state), they can't move or charge
        if (this.mode === 'cooperativo' && player.immobilized && i === 0) {
            try { sprite.setVelocityX(0); } catch (e) {}
            player.chargingShot = false;
            player.chargeAmount = 0;
            return;
        }
        if (this.mode === 'cooperativo' && i === 1) {
            // P2 puede disparar rápido y cargado solo con X (2) del gamepad, nunca con otro botón ni teclado
            if (!this.reticle) return;
            const shooter = this.players[0];
            const coopPlayer = player;
            const dead = 0.15; const maxDist = 300;
            if (pad && pad.connected) {
                const ax = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                const ay = (pad.axes.length > 1) ? pad.axes[1].getValue() : 0;
                if (Math.abs(ax) > dead || Math.abs(ay) > dead) {
                    this.reticle.x = shooter.sprite.x + ax * maxDist;
                    this.reticle.y = shooter.sprite.y + ay * maxDist;
                }
                if (!pad._lastButtons) pad._lastButtons = [];
                const btn = pad.buttons;
                
                // DETECCIÓN DE PARRY PARA P2: registrar cuando presiona A (botón 0) para bloquear
                const blockPressed = btn[0] && btn[0].pressed;
                if (blockPressed && !coopPlayer.wasBlocking) {
                    coopPlayer.blockPressTime = this.time.now;
                    coopPlayer.wasBlocking = true;
                    coopPlayer.blocking = true;
                } else if (!blockPressed) {
                    coopPlayer.wasBlocking = false;
                    coopPlayer.blocking = false;
                }
                
                // Disparo rápido con B (1) y disparo cargado con X (2) del gamepad
                const quickPressed = btn[1] && btn[1].pressed && !pad._lastButtons[1];
                const chargeHeld = btn[2] && btn[2].pressed;
                const chargeReleased = (!btn[2] || !btn[2].pressed) && pad._lastButtons[2];
                pad._lastButtons = btn.map(b => !!b.pressed);
                
                // Disparo cargado
                if (chargeHeld && this.getEnergy(coopPlayer) > 0) {
                    if (!coopPlayer.chargingShot) { coopPlayer.chargingShot = true; coopPlayer.chargeAmount = 0; coopPlayer.chargeStart = time; }
                    const dt = this.game.loop.delta / 1000;
                    const energyRate = 160;
                    const consume = Math.min(this.getEnergy(coopPlayer), energyRate * dt);
                    this.changeEnergyFor(coopPlayer, -consume);
                    coopPlayer.chargeAmount = (coopPlayer.chargeAmount || 0) + consume;
                    try { if (this.reticle) this.reticle.setScale(1 + Math.min(1.2, coopPlayer.chargeAmount / 240)); } catch (e) {}
                }
                
                // Al soltar el botón X, disparar el disparo cargado
                if (chargeReleased && coopPlayer.chargingShot && coopPlayer.chargeAmount > 0) {
                    const baseDamage = 20;
                    const steps = Math.floor((coopPlayer.chargeAmount || 0) / 25);
                    const damage = baseDamage + (steps * 3);
                    try { if (this.reticle) this.reticle.setScale(1); } catch (e) {}
                    if ((time - shooter.lastShot) > shooter.shotCD) {
                        shooter.lastShot = time;
                        this.spawnProjectile(0, damage);
                    }
                    coopPlayer.chargingShot = false; 
                    coopPlayer.chargeAmount = 0; 
                    coopPlayer.chargeStart = 0;
                }
                
                // Si no está cargando, resetear
                if (!chargeHeld && !chargeReleased) {
                    coopPlayer.chargingShot = false;
                    coopPlayer.chargeAmount = 0;
                }
                
                // Disparo rápido
                if (quickPressed) {
                    if ((time - shooter.lastShot) > shooter.shotCD) {
                        shooter.lastShot = time;
                        this.spawnProjectile(0, 20);
                    }
                }
            } else {
                // Solo permitir mover la retícula con teclado, pero NO disparar ni cargar con teclado
                if (this.keysP2.left.isDown) this.reticle.x -= 4;
                if (this.keysP2.right.isDown) this.reticle.x += 4;
                if (this.keysP2.up.isDown) this.reticle.y -= 4;
                if (this.keysP2.down.isDown) this.reticle.y += 4;
                coopPlayer.chargingShot = false;
                coopPlayer.chargeAmount = 0;
            }
            return;
        }

        let left = false, right = false, up = false, punch = false, blockOrCharge = false, shoot = false;

        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            const axisY = (pad.axes.length > 1) ? pad.axes[1].getValue() : 0;
            left = axisX < -0.3;
            right = axisX > 0.3;
            // Jump when pushing the left stick up beyond a threshold
            up = axisY < -0.6;
            if (!pad._lastButtons) pad._lastButtons = [];
            const btn = pad.buttons;
            // Gamepad mapping changes:
            // A (btn 0) => Block/Charge
            // B (btn 1) => Shoot
            // X (btn 2) => Punch
            if (btn[2] && btn[2].pressed && !pad._lastButtons[2]) punch = true; // X stays punch
            // En modo cooperativo, P1 no puede disparar
            if (!(this.mode === 'cooperativo' && i === 0)) {
                if (btn[1] && btn[1].pressed && !pad._lastButtons[1]) shoot = true; // B becomes shoot
            }
            blockOrCharge = btn[0] && btn[0].pressed; // A becomes block/charge
            pad._lastButtons = btn.map(b => !!b.pressed);
        }

        // Keyboard fallback
        if (i === 0) {
            left = left || this.keysP1.left.isDown;
            right = right || this.keysP1.right.isDown;
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.up)) up = true;
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) punch = true;
            blockOrCharge = blockOrCharge || this.keysP1.block.isDown; // Usar solo C para bloquear/cargar
            // En modo cooperativo, P1 no puede disparar
            if (!(this.mode === 'cooperativo' && i === 0)) {
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.shoot)) shoot = true;
            }
        } else {
            left = left || this.keysP2.left.isDown;
            right = right || this.keysP2.right.isDown;
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.up)) up = true;
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) punch = true;
            blockOrCharge = blockOrCharge || this.keysP2.block.isDown; // Usar solo L para bloquear/cargar
            // En modo cooperativo, P2 no puede disparar con teclado
            if (!(this.mode === 'cooperativo' && i === 1)) {
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.shoot)) shoot = true;
            }
        }

        // --- NUEVO: Si está bloqueando o cargando, no puede hacer nada más ---
        // Determinar si está cerca del enemigo (para bloquear) o lejos (para cargar)
        const other = this.players[1 - i];
        const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, other.sprite.x, other.sprite.y);
        const chargeDistance = 140; // Si está a más de 140px, puede cargar

        if (blockOrCharge) {
            // Registrar tiempo cuando se presiona bloquear por primera vez (para parry perfecto)
            // En modo cooperativo: solo el P2 (que dispara con gamepad) puede hacer parry
            // En modo versus: ambos pueden bloquear normalmente
            const isShooterInCoop = (this.mode === 'cooperativo' && i === 1); // P2 dispara en coop
            if ((isShooterInCoop || this.mode !== 'cooperativo') && !player.wasBlocking) {
                player.blockPressTime = this.time.now;
                player.wasBlocking = true;
            }
            
            const charIndexLocal = charIndex;
            if (dist > chargeDistance) {
                // Cargar energía (lejos)
                player.blocking = false;
                
                // Para Sofía y Mario, usar overlay de carga
                if ((charIndexLocal === 1 && this.textures.exists('sofia_charge') && this.anims.exists('sofia_charge_anim')) ||
                    (charIndexLocal === 3 && this.textures.exists('mario_charge') && this.anims.exists('mario_charge_anim'))) {
                    
                    const chargeTexture = charIndexLocal === 1 ? 'sofia_charge' : 'mario_charge';
                    const chargeAnim = charIndexLocal === 1 ? 'sofia_charge_anim' : 'mario_charge_anim';
                    
                    if (!player.chargeOverlay) {
                        const chargeSprite = this.add.sprite(sprite.x, sprite.y, chargeTexture, 0).setDepth(sprite.depth + 1);
                        chargeSprite.setOrigin(0.5, 0.5);
                        chargeSprite.flipX = sprite.flipX;
                        chargeSprite.play(chargeAnim);
                        player.chargeOverlay = chargeSprite;
                        // Ocultar sprite base
                        try { sprite.setAlpha(0); } catch (e) { }
                    }
                } else {
                    // Otros personajes: sistema normal
                    sprite.setTint(0x2222cc); // Color para cargar
                    const chargeKey = `char${charIndexLocal}_charge`;
                    if (this.textures.exists(chargeKey)) {
                        try { sprite.setTexture(chargeKey); sprite.setFrame(1); } catch (e) { /* ignore */ }
                    } else {
                        try { if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop(); sprite.setFrame(1); } catch (e) { /* ignore if no frame 1 */ }
                    }
                }
                
                // En modo versus, cargar normalmente. En coop, ya se maneja al inicio
                if (this.mode !== 'cooperativo') {
                    this.changeEnergyFor(player, 2.0);
                }
            } else {
                // Bloquear (cerca)
                player.blocking = true;
                
                // Para Sofía y Mario, usar overlay de bloqueo (frame 0 estático)
                if ((charIndexLocal === 1 && this.textures.exists('sofia_charge') && this.anims.exists('sofia_block')) ||
                    (charIndexLocal === 3 && this.textures.exists('mario_block') && this.anims.exists('mario_block'))) {
                    
                    const blockTexture = charIndexLocal === 1 ? 'sofia_charge' : 'mario_block';
                    const blockAnim = charIndexLocal === 1 ? 'sofia_block' : 'mario_block';
                    
                    if (!player.blockOverlay) {
                        const blockSprite = this.add.sprite(sprite.x, sprite.y, blockTexture, 0).setDepth(sprite.depth + 1);
                        blockSprite.setOrigin(0.5, 0.5);
                        blockSprite.flipX = sprite.flipX;
                        blockSprite.play(blockAnim);
                        player.blockOverlay = blockSprite;
                        // Ocultar sprite base
                        try { sprite.setAlpha(0); } catch (e) { }
                    }
                } else {
                    // Otros personajes: sistema normal
                    sprite.setTint(0x336633); // Color para bloquear
                    const blockKey = `char${charIndexLocal}_block`;
                    if (this.textures.exists(blockKey)) {
                        try { sprite.setTexture(blockKey); sprite.setFrame(1); } catch (e) { /* ignore */ }
                    } else {
                        try { if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop(); sprite.setFrame(1); } catch (e) { /* ignore if no frame 1 */ }
                    }
                }
            }
            // No puede moverse, saltar, disparar ni pegar
            sprite.setVelocityX(0);
            return;
            } else {
            player.blocking = false;
            player.wasBlocking = false; // Reset para detectar próxima pulsación
            
            // Destruir overlays de bloqueo/carga de Sofía si existen
            if (player.blockOverlay) {
                if (player.blockOverlay.scene) player.blockOverlay.destroy();
                player.blockOverlay = null;
            }
            if (player.chargeOverlay) {
                if (player.chargeOverlay.scene) player.chargeOverlay.destroy();
                player.chargeOverlay = null;
            }
            
            // Restaurar visibilidad del sprite base
            try { sprite.setAlpha(1); } catch (e) { }
            
            // restaurar colores originales y textura/frame por defecto
            if (sprite.clearTint) sprite.clearTint();
            const idleKey = `char${charIndex}_idle`;
            if (this.textures.exists(idleKey)) {
                try {
                    sprite.setTexture(idleKey);
                    if (charIndex === 2) sprite.setFrame(3); // Franchesca idle usa frame 3 de caminar
                    else sprite.setFrame(0);
                } catch (e) { /* ignore */ }
            } else {
                try {
                    if (charIndex === 2) sprite.setFrame(3);
                    else sprite.setFrame(0);
                } catch (e) { /* ignore */ }
            }
        }

    // Movimiento solo si NO está bloqueando/cargando
        const speed = 220;
        if (left) { sprite.setVelocityX(-speed); sprite.flipX = true; }
        else if (right) { sprite.setVelocityX(speed); sprite.flipX = false; }
        else { sprite.setVelocityX(0); }

        // Overlays de caminar para Charles (char0), Sofía (char1), Franchesca (char2) y Mario (char3)
        if (
            (charIndex === 0 && this.textures.exists('char0_walk') && this.anims.exists('char0_walk')) ||
            (charIndex === 1 && this.textures.exists('sofia_walk') && this.anims.exists('sofia_walk')) ||
            (charIndex === 2 && this.textures.exists('char2_walk') && this.anims.exists('char2_walk')) ||
            (charIndex === 3 && this.textures.exists('mario_walk') && this.anims.exists('mario_walk'))
        ) {
            const isMoving = left || right;
            // Si Charles está transformado, no debe mostrar animación de caminar (queda en frame 0 de trans)
            const blockCharlesWalk = (charIndex === 0 && player.transformed === true);
            if (isMoving && !player.walkOverlay && !blockCharlesWalk) {
                let walkTexture, walkAnim;
                if (charIndex === 0) { walkTexture = 'char0_walk'; walkAnim = 'char0_walk'; }
                else if (charIndex === 1) { walkTexture = 'sofia_walk'; walkAnim = 'sofia_walk'; }
                else if (charIndex === 2) { walkTexture = 'char2_walk'; walkAnim = 'char2_walk'; }
                else { walkTexture = 'mario_walk'; walkAnim = 'mario_walk'; }
                // Crear overlay de caminar
                const walkSprite = this.add.sprite(sprite.x, sprite.y, walkTexture, 0).setDepth(sprite.depth + 1);
                walkSprite.setOrigin(0.5, 0.5);
                walkSprite.flipX = sprite.flipX;
                walkSprite.play(walkAnim);
                player.walkOverlay = walkSprite;
            } else if ((!isMoving || blockCharlesWalk) && player.walkOverlay) {
                // Destruir overlay de caminar cuando se detiene o cuando Charles está transformado
                try {
                    if (player.walkOverlay && player.walkOverlay.scene) player.walkOverlay.destroy();
                    player.walkOverlay = null;
                } catch (e) { /* ignore */ }
            }
        }

    // Saltar
        if (up && sprite.body.onFloor()) sprite.setVelocityY(-560);

    // Pequeña recarga pasiva
        this.changeEnergyFor(player, 0.05);

        // Puñetazo: 50 de daño
        if (punch && (time - player.lastPunch) > player.punchCD) {
            player.lastPunch = time;
            
            // Overlays de golpe para Charles (char0), Sofía (char1), Franchesca (char2) y Mario (char3)
            if (
                (charIndex === 0 && (this.textures.exists('char0_punch') || this.textures.exists('char0_trans')) ) ||
                (charIndex === 1 && this.textures.exists('sofia_punch') && this.anims.exists('sofia_punch')) ||
                (charIndex === 2 && this.textures.exists('char2_punch') && this.anims.exists('char2_punch')) ||
                (charIndex === 3 && this.textures.exists('mario_punch') && this.anims.exists('mario_punch'))
            ) {
                // Selección de recurso y animación
                let punchTexture, punchAnim;
                if (charIndex === 0) {
                    // Si Charles está transformado, usar golpe de trans (frames 0-3 de pj1-trans)
                    const useTrans = player.transformed === true && this.textures.exists('char0_trans') && this.anims.exists('char0_trans_punch');
                    punchTexture = useTrans ? 'char0_trans' : 'char0_punch';
                    punchAnim = useTrans ? 'char0_trans_punch' : 'char0_punch';
                } else if (charIndex === 1) {
                    punchTexture = 'sofia_punch';
                    punchAnim = 'sofia_punch';
                } else if (charIndex === 2) {
                    punchTexture = 'char2_punch';
                    punchAnim = 'char2_punch';
                } else { // charIndex === 3
                    punchTexture = 'mario_punch';
                    punchAnim = 'mario_punch';
                }

                const punchSprite = this.add.sprite(sprite.x, sprite.y, punchTexture, 1).setDepth(sprite.depth + 1);
                punchSprite.setOrigin(0.5, 0.5);
                punchSprite.flipX = sprite.flipX;
                if (this.anims.exists(punchAnim)) punchSprite.play(punchAnim);
                // Guardar referencia para seguir al jugador mientras dura la animación
                player.punchOverlay = punchSprite;
                // Ocultar el sprite base inicialmente
                try { sprite.setAlpha(0); } catch (e) { }
                punchSprite.once('animationcomplete', () => {
                    if (punchSprite && punchSprite.scene) punchSprite.destroy();
                    if (player.punchOverlay === punchSprite) player.punchOverlay = null;
                    // Restaurar visibilidad del sprite base
                    try { sprite.setAlpha(1); } catch (e) { }
                    // Ejecutar golpe justo al terminar la animación
                    this.doPunch(i);
                });
                // Evitar ejecutar golpe inmediatamente; ya lo haremos al terminar la animación
                return;
            } else {
                // Para otros personajes, usar el sistema normal con lock
                player._lockedAction = 'punch';
                player.actionLockUntil = time + 450;
                this.doPunch(i);
            }
        }

        // Disparo: 20 de daño, 100 energía
    if (shoot && (time - player.lastShot) > player.shotCD && this.getEnergy(player) >= 100) {
            // En modo cooperativo, si P2 está cargando, prevenir que P1 dispare manualmente
            if (!(this.mode === 'cooperativo' && this.players[1] && this.players[1].chargingShot)) {
                player.lastShot = time;
        this.changeEnergyFor(player, -100);
                
                // Para Sofía (char1), crear sprite de animación de disparo
                if (charIndex === 1 && this.textures.exists('char1_shoot') && this.anims.exists('char1_shoot')) {
                    const shootSprite = this.add.sprite(sprite.x, sprite.y, 'char1_shoot', 1).setDepth(sprite.depth + 1);
                    shootSprite.setOrigin(0.5, 0.5);
                    shootSprite.flipX = sprite.flipX;
                    shootSprite.play('char1_shoot');
                    // Guardar referencia para seguir al jugador mientras dura la animación
                    player.shootOverlay = shootSprite;
                    // Ocultar el sprite base inicialmente para evitar ver el idle
                    try { sprite.setAlpha(0); } catch (e) { }
                    shootSprite.once('animationcomplete', () => {
                        if (shootSprite && shootSprite.scene) shootSprite.destroy();
                        if (player.shootOverlay === shootSprite) player.shootOverlay = null;
                        // Restaurar visibilidad del sprite base
                        try { sprite.setAlpha(1); } catch (e) { }
                        // Disparar justo al terminar la animación
                        this.spawnProjectile(i);
                    });
                    // Evitar disparar inmediatamente; ya lo haremos al terminar la animación
                    return;
                } else if (charIndex === 2 && this.textures.exists('char2_punch')) {
                    // Franchesca disparo: usar solo frame 2 del spritesheet de punch (estático)
                    try {
                        sprite.setTexture('char2_punch');
                        sprite.setFrame(2);
                    } catch (e) { /* ignore */ }
                    // Lock la acción por corto tiempo para mantener el frame visible
                    player._lockedAction = 'shoot';
                    player.actionLockUntil = time + 300;
                } else {
                    // Para otros personajes, usar el sistema normal con lock
                    player._lockedAction = 'shoot';
                    player.actionLockUntil = time + 600;
                }
                // Otros personajes disparan inmediatamente
                this.spawnProjectile(i);
            } else {
                // opcional: feedback mínimo (sin consumir energía ni disparar)
                try { this.cameras.main.flash(80, 120, 120, 120); } catch (e) {}
            }
        }

        // Animations: determine current action and play appropriate animation
    // Character index mapping (the chosen character index is in this.player1Index/2Index)
    let action = 'idle';
        if (player.blocking) action = 'block';
        else if (shoot) action = 'shoot';
        else if (punch) action = 'punch';
        else if (left || right) action = 'walk';
        else if (up && !sprite.body.onFloor()) action = 'jump';
        // Build anim key
        // If an action was locked (punch/shoot), respect it until timeout
        if (player.actionLockUntil && time < player.actionLockUntil) {
            action = player._lockedAction || action;
        } else {
            player._lockedAction = null;
            player.actionLockUntil = 0;
        }

        const animKey = `char${charIndex}_${action}`;

        // Gestión de visibilidad de overlays para Sofía y Mario:
        // - Si shootOverlay activo: ocultar todo
        // - Si punchOverlay activo: ocultar idle y caminar (pero no el disparo)
        // - Si blockOverlay o chargeOverlay activo: ocultar idle y otros overlays
        // - Si solo walkOverlay activo: ocultar idle siempre
        // - Si ninguno activo: mostrar todo
        if (charIndex === 0 || charIndex === 1 || charIndex === 2 || charIndex === 3) {
            const hasShoot = player.shootOverlay && player.shootOverlay.active;
            const hasPunch = player.punchOverlay && player.punchOverlay.active;
            const hasWalk = player.walkOverlay && player.walkOverlay.active;
            const hasBlock = player.blockOverlay && player.blockOverlay.active;
            const hasCharge = player.chargeOverlay && player.chargeOverlay.active;
            
            if (hasShoot) {
                // Disparo esconde todo (idle, walk, punch, block, charge)
                try { sprite.setAlpha(0); } catch (e) { }
                if (hasWalk && player.walkOverlay) {
                    try { player.walkOverlay.setAlpha(0); } catch (e) { }
                }
                if (hasPunch && player.punchOverlay) {
                    try { player.punchOverlay.setAlpha(0); } catch (e) { }
                }
                if (hasBlock && player.blockOverlay) {
                    try { player.blockOverlay.setAlpha(0); } catch (e) { }
                }
                if (hasCharge && player.chargeOverlay) {
                    try { player.chargeOverlay.setAlpha(0); } catch (e) { }
                }
            } else if (hasBlock || hasCharge) {
                // Bloqueo/Carga esconde idle, walk y punch
                try { sprite.setAlpha(0); } catch (e) { }
                if (hasWalk && player.walkOverlay) {
                    try { player.walkOverlay.setAlpha(0); } catch (e) { }
                }
                if (hasPunch && player.punchOverlay) {
                    try { player.punchOverlay.setAlpha(0); } catch (e) { }
                }
                if (hasBlock && player.blockOverlay) {
                    try { player.blockOverlay.setAlpha(1); } catch (e) { }
                }
                if (hasCharge && player.chargeOverlay) {
                    try { player.chargeOverlay.setAlpha(1); } catch (e) { }
                }
            } else if (hasPunch) {
                // Golpe esconde idle y walk, pero no disparo
                try { sprite.setAlpha(0); } catch (e) { }
                if (hasWalk && player.walkOverlay) {
                    try { player.walkOverlay.setAlpha(0); } catch (e) { }
                }
                try { player.punchOverlay.setAlpha(1); } catch (e) { }
            } else if (hasWalk) {
                // Caminar siempre esconde el sprite base (idle)
                try { sprite.setAlpha(0); } catch (e) { }
                try { player.walkOverlay.setAlpha(1); } catch (e) { }
            } else {
                // Sin overlays, mostrar el sprite base normalmente
                try { sprite.setAlpha(1); } catch (e) { }
            }
        } else {
            // Otros personajes: lógica anterior (solo disparo)
            if (player.shootOverlay && player.shootOverlay.active) {
                if (action === 'idle') {
                    try { sprite.setAlpha(0); } catch (e) { }
                } else {
                    try { sprite.setAlpha(1); } catch (e) { }
                }
            } else {
                try { sprite.setAlpha(1); } catch (e) { }
            }
        }

        // Idle should be static: show first frame only instead of looping animation
        if (action === 'idle') {
            if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop();
            const idleKey = `char${charIndex}_idle`;
            if (this.textures.exists(idleKey)) {
                try {
                    sprite.setTexture(idleKey);
                    if (charIndex === 2) sprite.setFrame(3); // Franchesca idle usa frame 3 de caminar
                    else sprite.setFrame(0);
                } catch (e) { /* ignore */ }
            } else {
                try {
                    if (charIndex === 2) sprite.setFrame(3);
                    else sprite.setFrame(0);
                } catch (e) { /* ignore if frame not present */ }
            }
        } else {
            // Force texture to the action key if available (covers single-frame and spritesheet cases)
            if (this.textures.exists(animKey)) {
                try { sprite.setTexture(animKey); } catch (e) { /* ignore */ }
            }

            if (this.anims.exists(animKey)) {
                // For locked attack actions, ensure the animation plays once without restarting every frame
                if ((action === 'punch' || action === 'shoot') && player.actionLockUntil && time < player.actionLockUntil) {
                    try { sprite.anims.play(animKey, true); } catch (e) { /* ignore */ }
                } else {
                    // Normal behavior: don't restart if already playing
                    try { sprite.anims.play(animKey, true); } catch (e) { /* ignore */ }
                }
            } else {
                // If no animation exists, try to show an action frame
                try {
                    if (action === 'punch' || action === 'shoot') sprite.setFrame(1);
                    else sprite.setFrame(0);
                } catch (e) { /* ignore if frames missing */ }
            }
        }

        this.handleCharlesSpecial(i, time);
        this.handleCharlesTransform(i, time);
        this.handleCharlesExplosion(i, time);
        this.handleSofiaLaser(i, time);
        this.handleSofiaTeleport(i, time);
        this.handleSofiaMeteor(i, time);
        this.handleFranchescaEnergy(i, time);
        this.handleFranchescaJumpSlash(i, time);
        this.handleFranchescaSteal(i, time);
        // Permitir usar habilidad robada (L,L,X) si existe
        this.handleFranchescaUseStolen(i, time);
        
    // Habilidades de Mario
    this.handleMarioBeam(i, time);
    this.handleMarioSmash(i, time);
    this.handleMarioExplosion(i, time);
    }

    spawnProjectile(i) {
        // legacy signature: spawnProjectile(i) -> now supports optional damage via spawnProjectile(i, damage)
        const args = Array.prototype.slice.call(arguments);
        const explicitDamage = (args.length > 1) ? args[1] : null;
        const shooter = this.players[i];
        if (!shooter || !shooter.sprite) return;
        // Aumentar distancia del spawn del proyectil de 30 a 60 píxeles
        const sx = shooter.sprite.x + (shooter.sprite.flipX ? -60 : 60);
        const sy = shooter.sprite.y - 10;

        // Elegir sprite de proyectil según el personaje que dispara
        const shooterChar = (i === 0) ? this.player1Index : this.player2Index;
        let projKey = 'tex_bullet';
        if (shooterChar === 0 && this.textures.exists('charles_bullet')) {
            projKey = 'charles_bullet';
        } else if (shooterChar === 1 && this.textures.exists('sofia_bullet')) {
            projKey = 'sofia_bullet';
        }
        const proj = this.physics.add.sprite(sx, sy, projKey, 0); // Especificar frame 0 inicial
        proj.shooter = i;
        proj.setDepth(10); // Asegurar que el proyectil esté visible por encima de otros elementos
        
        if (explicitDamage != null) {
            proj.damage = explicitDamage;
            // Si el daño es mayor a 20 (disparo cargado), hacer el proyectil más grande
            if (explicitDamage > 20) {
                const scale = 1 + Math.min(2.5, (explicitDamage - 20) / 30);
                proj.setScale(scale);
            }
        }

        // La animación de disparo ya se maneja en updatePlayerInput con el lock
        // No reproducir aquí para evitar conflictos con animaciones personalizadas
        // const shootKey = `char${shooterChar}_shoot`;
        // if (this.anims.exists(shootKey)) {
        //     try { shooter.sprite.anims.play(shootKey, true); } catch (e) { }
        // } else if (this.textures.exists(shootKey)) {
        //     try { shooter.sprite.setTexture(shootKey); shooter.sprite.setFrame(0); } catch (e) { }
        // }

        this.projectiles.add(proj);
        proj.body.setAllowGravity(false);
        
        // Configurar para que no se destruya al salir de los límites del mundo
        proj.body.setCollideWorldBounds(false);
        proj.body.onWorldBounds = false;

        // Si es bala de Charles o Sofía, reproducir animación de vuelo
        if (projKey === 'charles_bullet' && this.anims.exists('charles_bullet_fly')) {
            try { proj.play('charles_bullet_fly'); } catch (e) { }
        } else if (projKey === 'sofia_bullet' && this.anims.exists('sofia_bullet_fly')) {
            try { proj.play('sofia_bullet_fly'); } catch (e) { }
        }

        // If cooperative mode and reticle exists, fire toward the reticle position
        if (this.mode === 'cooperativo' && this.reticle) {
            const angle = Phaser.Math.Angle.Between(sx, sy, this.reticle.x, this.reticle.y);
            const speed = 600;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            if (proj && proj.body) proj.body.setVelocity(vx, vy);
            proj.rotation = angle;
        } else {
            const velocity = shooter.sprite.flipX ? -450 : 450;
            if (proj && proj.body) proj.body.setVelocityX(velocity);
        }

        // Aumentar tiempo de vida del proyectil a 6000ms (6 segundos) para mayor alcance
        this.time.delayedCall(6000, () => {
            if (proj && proj.active) proj.destroy();
        });
    }

    doPunch(i) {
        const attacker = this.players[i];
        const target = this.players[1 - i];
        
        // Siempre reproducir animación de puñetazo
        const attChar = (i === 0) ? this.player1Index : this.player2Index;
        let atkPunchKey = `char${attChar}_punch`;
        // Si Charles está transformado, usar animación especial de trans golpe (frames 0-3 de pj1-trans)
        if (attChar === 0 && attacker.transformed && this.textures.exists('char0_trans')) {
            atkPunchKey = 'char0_trans_punch';
        }
        if (this.anims.exists(atkPunchKey)) {
            try { attacker.sprite.anims.play(atkPunchKey, true); } catch (e) { }
        } else if (this.textures.exists(atkPunchKey)) {
            try { attacker.sprite.setTexture(atkPunchKey); attacker.sprite.setFrame(0); } catch (e) { }
        }

        // En modo cooperativo, golpear enemigos (y jefe) en lugar de PvP
        if (this.mode === 'cooperativo') {
            if (!this.enemies) return;
            
            // Buscar enemigos cercanos
            const hitRange = 150;
            this.enemies.children.entries.forEach(enemy => {
                if (!enemy.active) return;
                
                const dist = Phaser.Math.Distance.Between(attacker.sprite.x, attacker.sprite.y, enemy.x, enemy.y);
                
                if (dist < hitRange) {
                    // Aplicar daño al enemigo
                    const damage = 50;
                    enemy.health -= damage;
                    
                    // Efecto visual: empujar al enemigo
                    const dir = (enemy.x > attacker.sprite.x) ? 1 : -1;
                    enemy.setVelocityX(300 * dir);
                    enemy.setVelocityY(-100);
                    
                    // Destruir enemigo si su vida llega a 0
                    if (enemy.health <= 0) {
                        if (enemy.healthBar) enemy.healthBar.destroy();
                        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                        enemy.destroy();
                        this.checkWaveComplete();
                    }
                }
            });

            // También golpear al jefe si está cerca
            if (this.bossActive && this.boss) {
                const b = this.boss;
                const distBoss = Phaser.Math.Distance.Between(attacker.sprite.x, attacker.sprite.y, b.x, b.y);
                if (distBoss < hitRange) {
                    b.health = Math.max(0, b.health - 15); // Cap: 15 por golpe
                    
                    // Pequeño retroceso y flash
                    const dir = (b.x > attacker.sprite.x) ? 1 : -1;
                    if (b.body) b.body.setVelocity(220 * dir, -120);
                    
                    const flash = this.add.circle(b.x, b.y, 20, 0xff3300, 0.8).setDepth(10);
                    this.tweens.add({
                        targets: flash,
                        alpha: 0,
                        scale: 2,
                        duration: 250,
                        onComplete: () => { try { flash.destroy(); } catch (e) {} }
                    });
                }
            }
            return;
        }

        // Modo versus: lógica PvP original
        const dist = Phaser.Math.Distance.Between(attacker.sprite.x, attacker.sprite.y, target.sprite.x, target.sprite.y);

        // Efecto imán: si el enemigo está cerca (menos de 150px), mover al atacante hacia él
        const magnetRange = 150;
        if (dist < magnetRange && dist > 0) {
            const dir = (target.sprite.x > attacker.sprite.x) ? 1 : -1;
            const magnetForce = 300; // Velocidad del imán
            attacker.sprite.setVelocityX(magnetForce * dir);
        }

        // Solo aplicar daño si está lo suficientemente cerca (después del imán)
        const hitRange = 90;
        if (dist < hitRange && !target.beingHit) {
            // Si Charles está transformado
            const isCharlesTrans = attacker.transformed && ((i === 0 && this.player1Index === 0) || (i === 1 && this.player2Index === 0));
            if (!target.blocking) {
                attacker.hitCount = (attacker.hitCount || 0) + 1;
                // Daño aumentado si está transformado
                const damage = isCharlesTrans ? 80 : 50;
                target.health = Math.max(0, target.health - damage);

                // Cada 3er golpe: golpe fuerte (solo si NO está bloqueando)
                if (attacker.hitCount % 3 === 0) {
                    const dir = (target.sprite.x > attacker.sprite.x) ? 1 : -1;
                    const horizontal = 1800 * dir;
                    const vertical = -250;
                    target.sprite.setVelocity(horizontal, vertical);
                }
            } else {
                // Si Charles está transformado y el objetivo bloquea, recibe daño constante por 1.5s
                if (isCharlesTrans) {
                    // Aplica daño constante por 1.5 segundos (25 por segundo)
                    const now = this.time.now;
                    if (!target.blockingDamageEnd || now > target.blockingDamageEnd) {
                        target.blockingDamageEnd = now + 1500;
                    }
                    target.blockingDamagePerSecond = 25;
                } else {
                    attacker.hitCount = 0;
                }
            }

            // Marcar como siendo golpeado (stun)
            target.beingHit = true;
            target.hitTimer = this.time.now + 400;
            const dir = (target.sprite.x > attacker.sprite.x) ? 1 : -1;
            attacker.sprite.setVelocityX(120 * dir);
        }
    }

    // Sistema de oleadas para modo cooperativo
    startWave() {
        if (this.currentWave >= this.maxWaves) {
            this.waveText.setText('¡Victoria! Todas las oleadas completadas');
            return;
        }
        
        this.currentWave++;
        this.waveActive = true;
        this.waveCompleted = false;
        
        const config = this.waveConfig[this.currentWave - 1];
        this.waveText.setText(`Oleada ${this.currentWave}/${this.maxWaves}`);
        
        // Crear mezcla de enemigos: alterna voladores y terrestres
        for (let i = 0; i < config.enemies; i++) {
            this.time.delayedCall(i * 800, () => {
                if (i % 2 === 0) this.spawnFlyingEnemy();
                else this.spawnGroundEnemy();
            });
        }
    }

    spawnFlyingEnemy() {
        if (this._cancelWaveSpawns) return; // debug: no spawns when jumping to boss
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Spawn en posiciones aleatorias del borde superior o lateral
        const spawnSide = Phaser.Math.Between(0, 2);
        let x, y;
        
        if (spawnSide === 0) { // Arriba
            x = Phaser.Math.Between(100, width - 100);
            y = 50;
        } else if (spawnSide === 1) { // Izquierda
            x = 50;
            y = Phaser.Math.Between(100, height - 200);
        } else { // Derecha
            x = width - 50;
            y = Phaser.Math.Between(100, height - 200);
        }
        
        // Crear sprite del enemigo volador con el nuevo sprite
        const enemy = this.physics.add.sprite(x, y, 'flying_enemy', 0);
        enemy.setScale(1.5); // Reducido de 3.5 a 1.5 (tamaño original del código)
        
        // Reproducir animación idle
        if (this.anims.exists('flying_enemy_idle')) {
            enemy.play('flying_enemy_idle');
        }
        
        // Propiedades del enemigo
        // Vida para aguantar ~4 disparos (20 daño c/u) y ~3 golpes (50 daño c/u)
        enemy.health = 180; // 4 disparos = 80, 3 golpes = 150, promedio ~180
        enemy.maxHealth = 180;
        enemy.lastShot = 0;
        enemy.shotCooldown = 4000; // Aumentado de 2000 a 4000ms (dispara cada 4 segundos)
        enemy.moveSpeed = 60; // Reducido de 100 a 60
        enemy.isFlying = true;
        
        this.enemies.add(enemy);
        enemy.body.setAllowGravity(false);
        enemy.setCollideWorldBounds(true);
        
        // Crear barra de vida del enemigo
        enemy.healthBarBg = this.add.rectangle(enemy.x, enemy.y - 30, 50, 6, 0x000000).setDepth(6);
        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y - 30, 50, 6, 0xff0000).setDepth(7);
        
        // Colisión con plataformas
        this.physics.add.collider(enemy, this.groundGroup);
        
        // Movimiento aleatorio más lento
        this.tweens.add({
            targets: enemy,
            x: Phaser.Math.Between(100, width - 100),
            y: Phaser.Math.Between(100, height - 200),
            duration: 5000, // Aumentado de 3000 a 5000ms (más lento)
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    // Enemigo terrestre que persigue, salta y refleja proyectiles del jugador
    spawnGroundEnemy() {
        if (this._cancelWaveSpawns) return; // debug: no spawns when jumping to boss
        const width = this.scale.width;
        const height = this.scale.height;

        // Aparece desde arriba, cerca de las plataformas superiores
        const side = Phaser.Math.Between(0, 1);
        const x = (side === 0) ? 200 : width - 200;
        const y = height * 0.3; // Spawn desde arriba para que caiga sobre las plataformas

        const enemy = this.physics.add.sprite(x, y, 'ground_enemy_walk', 0);
        enemy.setScale(1.5); // Reducido de 2.6 a 1.5 (mucho más pequeño)
        
        // Reproducir animación de caminar
        if (this.anims.exists('ground_enemy_walk')) {
            enemy.play('ground_enemy_walk');
        }

        // Propiedades
        enemy.type = 'ground';
        enemy.health = 220; // un poco más tanque que el volador
        enemy.maxHealth = 220;
        enemy.moveSpeed = 90;
        enemy.jumpSpeed = -420;
        enemy.lastMelee = 0;
        // Aumentar cooldown de ataque cuerpo a cuerpo para evitar stunlock
        enemy.meleeCooldown = 1400;
        enemy.reflectsProjectiles = true;
        enemy.lastJump = 0;
        enemy.jumpCooldown = 500;

        this.enemies.add(enemy);
        enemy.body.setAllowGravity(true);
        enemy.setCollideWorldBounds(true);

        // Crear barra de vida del enemigo
        enemy.healthBarBg = this.add.rectangle(enemy.x, enemy.y - 30, 50, 6, 0x000000).setDepth(6);
        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y - 30, 50, 6, 0x33cc33).setDepth(7);

        // Colisión con plataformas
        this.physics.add.collider(enemy, this.groundGroup);
        if (this._tilemapSueloLayer) {
            this.physics.add.collider(enemy, this._tilemapSueloLayer);
        }
    }

    // Jefe final: sprite animado limpio y funcional
    spawnBoss() {
        if (this.boss || this.bossActive) return;
        try { this.ensurePlayerSpriteValid(); } catch (e) {}
        
        const width = this.scale.width;
        const height = this.scale.height;

        // Crear sprite del jefe
        const boss = this.physics.add.sprite(width * 0.5, height * 0.3, 
            this.textures.exists('boss_walk') ? 'boss_walk' : 'char0_idle', 0);
        boss.setDepth(5);
        boss.setScale(1.8);
        boss.setCollideWorldBounds(true);
        
            // Propiedades del jefe (simple como enemigo terrestre)
            boss.health = 1000;
            boss.maxHealth = 1000;
            boss.moveSpeed = 80;
            boss.lastShot = 0;
            boss.shotCooldown = 3500;
            boss.lastAreaAttack = 0;
            boss.areaAttackCooldown = 8000;
            boss.lastJump = 0;
            boss.reflectsProjectiles = true; // Siempre devuelve proyectiles como enemigo terrestre

        this.boss = boss;
        this.bossActive = true;
        this.waveText.setText('¡Jefe Final!');
        
        // Collider con el suelo
        this.physics.add.collider(boss, this.groundGroup);
        if (this._tilemapSueloLayer) {
            this.physics.add.collider(boss, this._tilemapSueloLayer);
        }
        
            // Overlap: proyectiles del jugador contra el jefe
            // - Si son de PARRY perfecto: dañan al jefe y se destruyen
            // - Si son normales: se desvían hacia el jugador (no destruyen al tocar al jefe)
            this.physics.add.overlap(this.projectiles, boss, (proj) => {
                if (!proj || !proj.active || !this.boss || !this.bossActive) return;

                // Si el proyectil viene marcado como parryReflected, dañar jefe y destruirlo
                if (proj.parryReflected) {
                    const damage = proj.damage || 70;
                    this.boss.health = Math.max(0, this.boss.health - damage);
                    // Efecto visual
                    const flash = this.add.circle(proj.x, proj.y, 25, 0xff00ff, 0.8).setDepth(10);
                    this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 400, onComplete: () => { try { flash.destroy(); } catch (e) {} } });
                    try { proj.destroy(); } catch (e) {}
                    return;
                }

                // Evitar doble-procesado si ya fue desviado por el jefe
                if (proj.isReflected && proj.shooter === -1) return;

                // Desviar proyectil normal
                proj.isReflected = true;
                proj.parryReflected = false;
                try { proj.setTint(0x9933ff); } catch (e) {}

                if (this.boss && this.anims.exists('boss_attack')) {
                    this.boss.play('boss_attack');
                    this.boss.once('animationcomplete', () => {
                        if (this.boss && this.anims.exists('boss_idle')) this.boss.play('boss_idle');
                    });
                }

                const playerSprite = this.players[0] && this.players[0].sprite;
                if (playerSprite && proj.body) {
                    const ang = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, playerSprite.x, playerSprite.y);
                    const curSpeed = Math.max(460, Math.hypot(proj.body.velocity.x || 0, proj.body.velocity.y || 0));
                    proj.body.setAllowGravity(false);
                    proj.body.setVelocity(Math.cos(ang) * curSpeed, Math.sin(ang) * curSpeed);
                    proj.rotation = ang;
                    proj.shooter = -1; // tratar como enemigo
                }

                this.projectiles.remove(proj, false, false);
                this.enemyProjectiles.add(proj, false);
            });
        
        // Crear UNA sola barra de vida limpia
        const barWidth = 600;
        const barX = width / 2;
        const barY = height - 50;
        
        if (this.bossHealthBarBg) this.bossHealthBarBg.destroy();
        if (this.bossHealthBar) this.bossHealthBar.destroy();
        if (this.bossHealthText) this.bossHealthText.destroy();
        
        this.bossHealthBarBg = this.add.rectangle(barX, barY, barWidth, 30, 0x000000).setDepth(100).setScrollFactor(0);
        this.bossHealthBar = this.add.rectangle(barX, barY, barWidth, 30, 0xff0066).setDepth(101).setScrollFactor(0);
        this.bossHealthText = this.add.text(barX, barY, 'JEFE: 1000/1000', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);
        
        // Animación inicial
        if (this.anims.exists('boss_idle')) {
            try { boss.play('boss_idle'); } catch (e) {}
        }
    }

    spawnBossSpikeAt(x, y) {
        // Crear un pincho estático que dura poco tiempo
        const spike = this.add.rectangle(x, y + 32, 20, 64, 0xcc0066).setDepth(4);
        this.physics.add.existing(spike, true); // estático
        this.bossSpikes.add(spike);
        // Destruir después de 700ms
        this.time.delayedCall(700, () => { try { if (spike && spike.scene) spike.destroy(); } catch (e) {} });
    }


    bossShootAtPlayer() {
        if (!this.boss || !this.players[0] || !this.players[0].sprite) return;
        const b = this.boss;
        const player = this.players[0].sprite;
        const angle = Phaser.Math.Angle.Between(b.x, b.y, player.x, player.y);
        
        const proj = this.physics.add.sprite(b.x, b.y - 40, 'tex_bullet');
        proj.setTint(0x9933ff);
        proj.setScale(2.2);
        proj.damage = 50;
        this.enemyProjectiles.add(proj);
        proj.body.setAllowGravity(false);
        proj.body.setVelocity(Math.cos(angle) * 460, Math.sin(angle) * 460);
        proj.rotation = angle;
        this.time.delayedCall(3500, () => { if (proj && proj.active) proj.destroy(); });
    }

    updateBoss(time) {
        if (!this.bossActive || !this.boss || this.mode !== 'cooperativo') return;
        const b = this.boss;
        if (!b || !b.scene) { this.bossActive = false; this.boss = null; return; }
        
        const player = this.players[0] && this.players[0].sprite;
        if (!player) return;

        // Movimiento hacia el jugador
        const dir = (player.x > b.x) ? 1 : -1;
        b.body.setVelocityX(dir * b.moveSpeed);
        
        // Voltear sprite según dirección (false = derecha, true = izquierda)
        b.flipX = (dir < 0);
        
        // Salto automático si está bloqueado o jugador arriba
        const onFloor = b.body.blocked.down || b.body.touching.down;
        const blocked = b.body.blocked.left || b.body.blocked.right;
        const playerAbove = player.y < (b.y - 40);
        if (onFloor && (blocked || playerAbove) && (time - b.lastJump > 800)) {
            b.body.setVelocityY(-600); // Salto más alto
            b.lastJump = time;
        }
        
        // Animación idle/move
        if (this.anims.exists('boss_move') && this.anims.exists('boss_idle')) {
            const moving = Math.abs(b.body.velocity.x) > 10;
            if (moving && (!b.anims.isPlaying || b.anims.currentAnim.key !== 'boss_move')) {
                b.play('boss_move');
            } else if (!moving && (!b.anims.isPlaying || b.anims.currentAnim.key !== 'boss_idle')) {
                b.play('boss_idle');
            }
        }

        // Actualizar barra de vida
        if (this.bossHealthBar && this.bossHealthText) {
            const healthPercent = Math.max(0, b.health / b.maxHealth);
            this.bossHealthBar.width = 600 * healthPercent;
            this.bossHealthText.setText(`JEFE: ${Math.ceil(b.health)}/${b.maxHealth}`);
        }

        // Disparar cada 3.5s
        if (time - b.lastShot > b.shotCooldown) {
            b.lastShot = time;
            this.bossShootAtPlayer();
        }

        // Ataque de área cada 8s
        const dist = Phaser.Math.Distance.Between(b.x, b.y, player.x, player.y);
        if (time - b.lastAreaAttack > b.areaAttackCooldown) {
            b.lastAreaAttack = time;
            
                // Efecto visual AoE (ataque de área)
            const areaCircle = this.add.circle(b.x, b.y, 300, 0xff0066, 0.3).setDepth(4);
            this.tweens.add({
                targets: areaCircle,
                alpha: 0,
                scale: 1.2,
                duration: 800,
                onComplete: () => { try { areaCircle.destroy(); } catch (e) {} }
            });
            
                // Daño AoE si jugador dentro del radio (100 de daño)
            if (dist < 300) {
                this.applyDamageToPlayer(0, 100);
                this.cameras.main.shake(200, 0.02);
            }
        }

        // Muerte del jefe
        if (b.health <= 0) {
            if (this.bossHealthBarBg) this.bossHealthBarBg.destroy();
            if (this.bossHealthBar) this.bossHealthBar.destroy();
            if (this.bossHealthText) this.bossHealthText.destroy();
            
            try { b.destroy(); } catch (e) {}
            this.boss = null;
            this.bossActive = false;
            
            try {
                this.scene.launch('VictoryScene', { mode: this.mode });
                this.scene.stop();
            } catch (e) {
                this.waveText.setText('¡Victoria! Jefe derrotado');
            }
        }
    }

    updateEnemies(time) {
        if (!this.enemies || this.mode !== 'cooperativo') return;
        
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            
            // Actualizar barra de vida del enemigo
            if (enemy.healthBar && enemy.healthBarBg) {
                enemy.healthBarBg.x = enemy.x;
                enemy.healthBarBg.y = enemy.y - 30;
                enemy.healthBar.x = enemy.x;
                enemy.healthBar.y = enemy.y - 30;
                const healthPercent = Math.max(0, enemy.health / (enemy.maxHealth || 180));
                enemy.healthBar.width = 50 * healthPercent;
            }
            
            if (enemy.isFlying) {
                // Disparar al jugador (solo voladores)
                if (time - enemy.lastShot > enemy.shotCooldown) {
                    enemy.lastShot = time;
                    this.enemyShoot(enemy);
                }
            } else if (enemy.type === 'ground') {
                // IA básica de persecución y salto
                const playerSprite = this.players[0] && this.players[0].sprite;
                if (!playerSprite) return;

                // Movimiento horizontal hacia el jugador
                const dir = (playerSprite.x > enemy.x) ? 1 : -1;
                enemy.setVelocityX(dir * (enemy.moveSpeed || 90));
                
                // Voltear el sprite según la dirección del movimiento
                if (dir > 0) {
                    enemy.flipX = false; // Mirando a la derecha
                } else {
                    enemy.flipX = true; // Mirando a la izquierda
                }

                // Si el jugador está más alto, intentar saltar con cooldown
                const now = time || this.time.now;
                const onFloor = enemy.body && (enemy.body.blocked && enemy.body.blocked.down || enemy.body.touching && enemy.body.touching.down);
                const horizDist = Math.abs(playerSprite.x - enemy.x);
                const shouldJump = (playerSprite.y + 20 < enemy.y) || (enemy.body && (enemy.body.blocked && (enemy.body.blocked.left || enemy.body.blocked.right)));
                if (onFloor && shouldJump && (now - (enemy.lastJump || 0) > (enemy.jumpCooldown || 500)) && horizDist < 160) {
                    enemy.setVelocityY(enemy.jumpSpeed || -420);
                    enemy.lastJump = now;
                }

                // Ataque cuerpo a cuerpo si está cerca, con i-frames para jugador y menor stun
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, playerSprite.x, playerSprite.y);
                const targetP = this.players[0];
                const playerIframesUntil = (targetP && targetP.groundMeleeIframesUntil) || 0;
                if (
                    dist < 65 &&
                    now - (enemy.lastMelee || 0) > (enemy.meleeCooldown || 1400) &&
                    now >= playerIframesUntil
                ) {
                    enemy.lastMelee = now;
                    
                    // Reproducir animación de ataque
                    if (enemy.texture && enemy.texture.key === 'ground_enemy_walk' && this.anims.exists('ground_enemy_attack')) {
                        enemy.play('ground_enemy_attack');
                        // Volver a caminar después de la animación
                        enemy.once('animationcomplete', () => {
                            if (enemy.active && this.anims.exists('ground_enemy_walk')) {
                                enemy.play('ground_enemy_walk');
                            }
                        });
                    }
                    
                    // Daño fijo de 45
                    this.applyDamageToPlayer(0, 45);
                    // Reducir el tiempo de stun específico de este golpe
                    if (targetP) {
                        targetP.hitTimer = this.time.now + 150; // stun corto
                        // Dar i-frames contra golpes cuerpo a cuerpo para evitar stunlock si hay varios enemigos
                        targetP.groundMeleeIframesUntil = now + 750; // 0.75s sin poder ser golpeado por melee
                    }
                    // Pequeño retroceso visual al jugador
                    const kdir = (playerSprite.x > enemy.x) ? 1 : -1;
                    try { playerSprite.setVelocity(220 * kdir, -120); } catch (e) { /* ignore */ }
                }
            }
        });
    }

    enemyShoot(enemy) {
        if (!enemy.active || !this.players[0].sprite) return;
        
        const player = this.players[0].sprite;
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        
        // Reproducir animación de disparo si es un enemigo volador
        if (enemy.isFlying && enemy.texture && enemy.texture.key === 'flying_enemy') {
            if (this.anims.exists('flying_enemy_shoot')) {
                enemy.play('flying_enemy_shoot');
                // Disparar al terminar la animación
                enemy.once('animationcomplete', () => {
                    // Crear proyectil enemigo después de la animación
                    const proj = this.physics.add.sprite(enemy.x, enemy.y, 'tex_bullet');
                    proj.setTint(0xff6600); // Color naranja para proyectiles enemigos
                    proj.setScale(2.5); // Hacer el proyectil más grande
                    proj.damage = 35;
                    
                    this.enemyProjectiles.add(proj);
                    proj.body.setAllowGravity(false);
                    
                    const speed = 400;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    proj.body.setVelocity(vx, vy);
                    proj.rotation = angle;
                    
                    // Destruir después de 3 segundos
                    this.time.delayedCall(3000, () => {
                        if (proj && proj.active) proj.destroy();
                    });
                    
                    // Volver a idle después de disparar
                    if (enemy.active && this.anims.exists('flying_enemy_idle')) {
                        enemy.play('flying_enemy_idle');
                    }
                });
                // No crear proyectil inmediatamente, esperar a la animación
                return;
            }
        }
        
        // Para enemigos que no tienen animación de disparo, disparar inmediatamente
        const proj = this.physics.add.sprite(enemy.x, enemy.y, 'tex_bullet');
        proj.setTint(0xff6600); // Color naranja para proyectiles enemigos
        proj.setScale(2.5); // Hacer el proyectil más grande
        proj.damage = 35;
        
        this.enemyProjectiles.add(proj);
        proj.body.setAllowGravity(false);
        
        const speed = 400;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        proj.body.setVelocity(vx, vy);
        proj.rotation = angle;
        
        // Destruir después de 3 segundos
        this.time.delayedCall(3000, () => {
            if (proj && proj.active) proj.destroy();
        });
    }

    checkWaveComplete() {
        if (!this.enemies) return;
        
        const activeEnemies = this.enemies.children.entries.filter(e => e.active).length;
        
        if (activeEnemies === 0 && this.waveActive) {
            this.waveActive = false;
            this.waveCompleted = true;
            
            // Recuperar 150 HP al completar una oleada
            try {
                const p = this.players && this.players[0];
                if (p) {
                    p.health = Math.min(1000, (p.health || 0) + 150);
                    // Feedback visual: flash verde y mensaje
                    this.cameras.main.flash(200, 80, 255, 80);
                }
            } catch (e) { /* ignore */ }
            
            if (this.currentWave < this.maxWaves) {
                this.waveText.setText(`Oleada ${this.currentWave} completada. +150 HP. Siguiente en 3s...`);
                this.time.delayedCall(3000, () => this.startWave());
            } else if (!this.bossActive && !this.boss) {
                this.waveText.setText('¡Jefe final! Prepárate...');
                // Spawn boss after a short delay
                this.time.delayedCall(2500, () => this.spawnBoss());
            }
        }
    }

    handleCharlesSpecial(i, time) {
        if (this.mode === 'cooperativo') return; // disable PvP specials in coop
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Charles (índice 0 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 0) || (i === 1 && this.player2Index !== 0)) return;

        // Si ya está activa la habilidad, aplicar daño continuo
        if (player.specialActive) {
            if (time < player.specialTimer) {
                // Daño continuo: 30 por segundo (cada frame)
                const target = this.players[1 - i];
                if (!target.blocking) {
                    const dt = this.game.loop.delta / 1000;
                    target.health = Math.max(0, target.health - 30 * dt);
                }
            } else {
                player.specialActive = false;
            }
            return;
        }

        // Detectar secuencia: IZQ, DER, GOLPE (en menos de 1s entre cada uno)
        // Solo si tiene suficiente energía (150)
        if (player.energy < 150) {
            player.specialBuffer = [];
            return;
        }

        // Detectar teclas o gamepad
        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX < -0.7 && !pad._specialLeft) { input = "L"; pad._specialLeft = true; }
            if (axisX > 0.7 && !pad._specialRight) { input = "R"; pad._specialRight = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._specialLeft = pad._specialRight = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._specialHit) { input = "X"; pad._specialHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._specialHit = false;
        }

        // Buffer de secuencia
        if (input) {
            const now = time;
            if (player.specialBuffer.length === 0 || (now - (player.specialBuffer[player.specialBuffer.length - 1].t)) < 1000) {
                player.specialBuffer.push({ k: input, t: now });
                if (player.specialBuffer.length > 3) player.specialBuffer.shift();
            } else {
                player.specialBuffer = [{ k: input, t: now }];
            }
        }

        // Verificar secuencia
        if (
            player.specialBuffer.length === 3 &&
            player.specialBuffer[0].k === "L" &&
            player.specialBuffer[1].k === "R" &&
            player.specialBuffer[2].k === "X"
        ) {
            const target = this.players[1 - i];
            const normalPunchDist = 90;
            const specialDist = 180; // Un poco más de alcance que el golpe normal
            const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);

            if (dist <= specialDist && !target.blocking) {
                // Gasta energía y activa la habilidad
                player.energy = Math.max(0, player.energy - 150);
                player.specialActive = true;
                player.specialTimer = time + 3000; // 3 segundos de daño continuo

                // Animación de golpe que quema (pj1-skill1 frames 0-6)
                const charIdx = (i === 0) ? this.player1Index : this.player2Index;
                if (charIdx === 0) {
                    const fireKey = 'char0_punch_fire';
                    if (this.anims.exists(fireKey)) {
                        try { sprite.anims.play(fireKey, false); } catch (e) { }
                    } else if (this.textures.exists(fireKey)) {
                        try { sprite.setTexture(fireKey); sprite.setFrame(0); } catch (e) { }
                    }
                }

                // Daño instantáneo y retroceso fuerte (pero no exagerado)
                target.health = Math.max(0, target.health - 65);
                const dir = (target.sprite.x > sprite.x) ? 1 : -1;
                target.sprite.setVelocity(600 * dir, -120); // Empuje fuerte pero no extremo
            } else if (dist > specialDist) {
                // Si está lejos, Charles se lanza hacia el rival (dash fuerte)
                const dir = (target.sprite.x > sprite.x) ? 1 : -1;
                sprite.setVelocityX(900 * dir); // Dash rápido
                // No activa la habilidad hasta estar cerca y repetir la secuencia
            }
            // Limpiar buffer siempre
            player.specialBuffer = [];
        }
    }

    handleCharlesTransform(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Charles (índice 0 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 0) || (i === 1 && this.player2Index !== 0)) return;

        // Si ya está transformado, controlar duración y efectos
        if (player.transformed) {
            sprite.setTint(0xffcc00); // Color de transformación
            player.blocking = false; // No puede bloquear
            // Visual: mantener siempre frame 0 de pj1-trans
            if (this.textures.exists('char0_trans')) {
                try { sprite.setTexture('char0_trans'); sprite.setFrame(0); } catch (e) { }
            }
            if (time > player.transformTimer) {
                player.transformed = false;
                if (sprite.clearTint) sprite.clearTint(); // Restaurar colores originales
            }
            return;
        }

        // Detectar secuencia: DERECHA, IZQ, GOLPE (en menos de 1s entre cada uno)
        if (this.getEnergy(player) < 300) {
            player.transformBuffer = [];
            return;
        }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX > 0.7 && !pad._transRight) { input = "R"; pad._transRight = true; }
            if (axisX < -0.7 && !pad._transLeft) { input = "L"; pad._transLeft = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._transRight = false; pad._transLeft = false; }
            // Botón de golpe (X, index 2)
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._transHit) { input = "X"; pad._transHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._transHit = false;
        }

        // Buffer de secuencia
        if (input) {
            const now = time;
            if (player.transformBuffer.length === 0 || (now - (player.transformBuffer[player.transformBuffer.length - 1].t)) < 1000) {
                player.transformBuffer.push({ k: input, t: now });
                if (player.transformBuffer.length > 3) player.transformBuffer.shift();
            } else {
                player.transformBuffer = [{ k: input, t: now }];
            }
        }

        // Verificar secuencia
        if (
            player.transformBuffer.length === 3 &&
            player.transformBuffer[0].k === "R" &&
            player.transformBuffer[1].k === "L" &&
            player.transformBuffer[2].k === "X"
        ) {
            // Activar transformación
            this.changeEnergyFor(player, -300);
            player.transformed = true;
            player.transformTimer = time + 8000; // Dura 8 segundos (ajusta si quieres)
            player.transformBuffer = [];
            // Visual inicial de transformación: mantener frame 0 de pj1-trans (se fuerza en el branch transformado)
            if (this.textures.exists('char0_trans')) {
                try { sprite.setTexture('char0_trans'); sprite.setFrame(0); } catch (e) { }
            }
        }
    }

    handleCharlesExplosion(i, time) {
        if (this.mode === 'cooperativo') return; // disable PvP explosion in coop
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Charles (índice 0 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 0) || (i === 1 && this.player2Index !== 0)) return;

        // Si la explosión está pendiente, verifica si debe explotar
        if (player.explosionPending && time > player.explosionTimer) {
            player.explosionPending = false;
            const target = this.players[1 - i];
            this.cameras.main.flash(200, 255, 180, 0);

            // Crear "granada" en los pies del enemigo (frame 0, sin animar aún)
            if (this.textures.exists('charles_explosion') && this.anims.exists('charles_explosion')) {
                const grenadeY = target.sprite.y + (target.sprite.height ? target.sprite.height/2 : 32);
                const grenade = this.add.sprite(target.sprite.x, grenadeY, 'charles_explosion', 0).setDepth(20);
                grenade.setOrigin(0.5, 0.9);
                grenade.setScale(2); // Hacer la explosión mucho más grande
                this.time.delayedCall(200, () => {
                    if (grenade && grenade.scene) {
                        grenade.play('charles_explosion');
                        grenade.once('animationcomplete', () => {
                            if (grenade && grenade.scene) grenade.destroy();
                        });
                    }
                });
            }

            if (!target.blocking) {
                target.health = Math.max(0, target.health - 90);
                target.sprite.setVelocityY(-400);
            } else {
                target.health = Math.max(0, target.health - 30);
                target.sprite.setVelocityY(-120);
            }
            return;
        }

        // Detectar secuencia: DERECHA, DERECHA, GOLPE (en menos de 1s entre cada uno)
        if (this.getEnergy(player) < 180) {
            player.explosionBuffer = [];
            return;
        }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX > 0.7 && !pad._explRight) { input = "R"; pad._explRight = true; }
            if (axisX > -0.7 && axisX < 0.7) pad._explRight = false;
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._explHit) { input = "X"; pad._explHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._explHit = false;
        }

        // Buffer de secuencia
        if (input) {
            const now = time;
            if (player.explosionBuffer.length === 0 || (now - (player.explosionBuffer[player.explosionBuffer.length - 1].t)) < 1000) {
                player.explosionBuffer.push({ k: input, t: now });
                if (player.explosionBuffer.length > 3) player.explosionBuffer.shift();
            } else {
                player.explosionBuffer = [{ k: input, t: now }];
            }
        }

        // Verificar secuencia
        if (
            player.explosionBuffer.length === 3 &&
            player.explosionBuffer[0].k === "R" &&
            player.explosionBuffer[1].k === "R" &&
            player.explosionBuffer[2].k === "X"
        ) {
            this.changeEnergyFor(player, -180);
            player.explosionPending = true;
            player.explosionTimer = time + 1500; // 1.5 segundos después
            player.explosionBuffer = [];
            // reproducir animación de patada en Charles (kick)
            const charIdx2 = (i === 0) ? this.player1Index : this.player2Index;
            const kickKey = `char${charIdx2}_kick`;
            if (this.anims.exists(kickKey)) {
                try { sprite.anims.play(kickKey, false); } catch (e) { }
            } else if (this.textures.exists(kickKey)) {
                try { sprite.setTexture(kickKey); sprite.setFrame(0); } catch (e) { }
            }
        }
    }

    handleSofiaLaser(i, time) {
        if (this.mode === 'cooperativo') return; // disable PvP Sofia laser in coop
        const player = this.players[i];
        const sprite = player.sprite;

        // Solo Sofía (índice 1 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

        if (!player.sofiaLaserBuffer) player.sofiaLaserBuffer = [];
        if (this.getEnergy(player) < 100) {
            player.sofiaLaserBuffer = [];
            return;
        }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX < -0.7 && !pad._sofiaLeft) { input = "L"; pad._sofiaLeft = true; }
            if (axisX > 0.7 && !pad._sofiaRight) { input = "R"; pad._sofiaRight = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._sofiaLeft = pad._sofiaRight = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._sofiaHit) { input = "X"; pad._sofiaHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._sofiaHit = false;
        }

        if (input) {
            const now = time;
            if (player.sofiaLaserBuffer.length === 0 || (now - (player.sofiaLaserBuffer[player.sofiaLaserBuffer.length - 1].t)) < 1000) {
                player.sofiaLaserBuffer.push({ k: input, t: now });
                if (player.sofiaLaserBuffer.length > 3) player.sofiaLaserBuffer.shift();
            } else {
                player.sofiaLaserBuffer = [{ k: input, t: now }];
            }
        }

        // Verifica la secuencia
        if (
            player.sofiaLaserBuffer.length === 3 &&
            player.sofiaLaserBuffer[0].k === "L" &&
            player.sofiaLaserBuffer[1].k === "R" &&
            player.sofiaLaserBuffer[2].k === "X"
        ) {
            // Gasta energía y dispara el láser
            this.changeEnergyFor(player, -100);
            const target = this.players[1 - i];

            // Efecto visual: línea láser
            const laser = this.add.line(
                0, 0,
                sprite.x, sprite.y,
                target.sprite.x, target.sprite.y,
                0x00ffff
            ).setOrigin(0, 0).setLineWidth(6);

            this.time.delayedCall(180, () => { if (laser && laser.scene) laser.destroy(); });

            // Daño y atrae al enemigo hacia Sofía
            if (!target.blocking) {
                target.health = Math.max(0, target.health - 10);

                // Teletransporta al enemigo cerca de Sofía
                const offset = 60;
                let newX = sprite.x;
                if (target.sprite.x < sprite.x) {
                    newX = sprite.x - offset;
                } else {
                    newX = sprite.x + offset;
                }
                target.sprite.x = newX;
                target.sprite.y = sprite.y;
                target.sprite.setVelocity(0, 0);
            }

            player.sofiaLaserBuffer = [];
        }
    }

    handleSofiaTeleport(i, time) {
        if (this.mode === 'cooperativo') return; // disable PvP Sofia teleport in coop
        const player = this.players[i];
        const sprite = player.sprite;

        // Solo Sofía (índice 1 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

        if (!player.sofiaTeleportBuffer) player.sofiaTeleportBuffer = [];
        if (player.energy < 100) {
            player.sofiaTeleportBuffer = [];
            return;
        }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX > 0.7 && !pad._sofiaTRight) { input = "R"; pad._sofiaTRight = true; }
            if (axisX < -0.7 && !pad._sofiaTLeft) { input = "L"; pad._sofiaTLeft = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._sofiaTLeft = pad._sofiaTRight = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._sofiaTHit) { input = "X"; pad._sofiaTHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._sofiaTHit = false;
        }

        if (input) {
            const now = time;
            if (player.sofiaTeleportBuffer.length === 0 || (now - (player.sofiaTeleportBuffer[player.sofiaTeleportBuffer.length - 1].t)) < 1000) {
                player.sofiaTeleportBuffer.push({ k: input, t: now });
                if (player.sofiaTeleportBuffer.length > 3) player.sofiaTeleportBuffer.shift();
            } else {
                player.sofiaTeleportBuffer = [{ k: input, t: now }];
            }
        }

        // Verifica la secuencia
        if (
            player.sofiaTeleportBuffer.length === 3 &&
            player.sofiaTeleportBuffer[0].k === "R" &&
            player.sofiaTeleportBuffer[1].k === "L" &&
            player.sofiaTeleportBuffer[2].k === "X"
        ) {
            // Gasta energía y teletransporta
            this.changeEnergyFor(player, -100);
            const target = this.players[1 - i];

            // Teletransporta a un lado del enemigo
            const offset = 60;
            let newX = target.sprite.x;
            if (sprite.x < target.sprite.x) {
                newX = target.sprite.x - offset;
            } else {
                newX = target.sprite.x + offset;
            }
            sprite.x = newX;
            sprite.y = target.sprite.y;
            sprite.setVelocity(0, 0);

            // Daño si el enemigo no está bloqueando
            if (!target.blocking) {
                target.health = Math.max(0, target.health - 30);
            }

            // Efecto visual simple (flash)
            this.cameras.main.flash(120, 0, 255, 255);

            player.sofiaTeleportBuffer = [];
        }
    }

    handleSofiaMeteor(i, time) {
        if (this.mode === 'cooperativo') return; // disable PvP Sofia meteor in coop
        const player = this.players[i];
        const sprite = player.sprite;

        // Solo Sofía (índice 1 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

        if (!player.sofiaMeteorBuffer) player.sofiaMeteorBuffer = [];
        if (this.getEnergy(player) < 250) {
            player.sofiaMeteorBuffer = [];
            return;
        }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX > 0.7 && !pad._sofiaMRight) { input = "R"; pad._sofiaMRight = true; }
            if (axisX > -0.7 && axisX < 0.7) pad._sofiaMRight = false;
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._sofiaMHit) { input = "X"; pad._sofiaMHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._sofiaMHit = false;
        }

        if (input) {
            const now = time;
            if (player.sofiaMeteorBuffer.length === 0 || (now - (player.sofiaMeteorBuffer[player.sofiaMeteorBuffer.length - 1].t)) < 1000) {
                player.sofiaMeteorBuffer.push({ k: input, t: now });
                if (player.sofiaMeteorBuffer.length > 3) player.sofiaMeteorBuffer.shift();
            } else {
                player.sofiaMeteorBuffer = [{ k: input, t: now }];
            }
        }

        // Verifica la secuencia
        if (
            player.sofiaMeteorBuffer.length === 3 &&
            player.sofiaMeteorBuffer[0].k === "R" &&
            player.sofiaMeteorBuffer[1].k === "R" &&
            player.sofiaMeteorBuffer[2].k === "X"
        ) {
            // Mostrar el ÚLTIMO frame del sprite de casteo (frame 7) y mantenerlo hasta el impacto
            try {
                const charIdx = (i === 0) ? this.player1Index : this.player2Index;
                const candidates = [`char${charIdx}_charge`, `char${charIdx}_shoot`, `char${charIdx}_punch`];
                let castTex = null;
                for (const k of candidates) { if (this.textures.exists(k)) { castTex = k; break; } }
                if (castTex) {
                    sprite.setTexture(castTex);
                    try { if (sprite.setFrame) sprite.setFrame(7); } catch (e) { try { sprite.setFrame(0); } catch (ex) {} }
                }
                // Bloquear la acción a 'charge' hasta que impacte la piedra (se libera en onComplete del tween)
                const player = this.players[i];
                player._lockedAction = 'charge';
                // Asignar un lock largo; lo liberamos exactamente al finalizar el tween de la piedra
                player.actionLockUntil = this.time.now + 10000;
            } catch (e) { /* ignore animation errors */ }

            // Gasta energía y lanza el meteorito
            this.changeEnergyFor(player, -250);
            const target = this.players[1 - i];

            // Efecto visual: usar sprite personalizado (piedra) en lugar de esfera
            let meteor;
            if (this.textures.exists('sofia_piedra')) {
                const tex = this.textures.get('sofia_piedra');
                const total = (tex && typeof tex.frameTotal === 'number') ? Math.max(1, tex.frameTotal) : 1;
                const lastFrame = Math.max(0, total - 1);
                meteor = this.add.sprite(target.sprite.x, target.sprite.y - 400, 'sofia_piedra', lastFrame).setDepth(10);
                // No forzar displaySize; usar 64x64 real del frame para evitar ver toda la tira
                try { if (meteor && meteor.play) meteor.play('sofia_piedra_spin'); } catch (e) { /* ignore */ }
            } else {
                // Fallback visual si la textura no está: círculo rojo
                meteor = this.add.circle(target.sprite.x, target.sprite.y - 400, 38, 0xff3300).setDepth(10);
            }

            this.tweens.add({
                targets: meteor,
                y: target.sprite.y,
                duration: 500,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    // Daño si el enemigo no está bloqueando
                    if (!target.blocking) {
                        target.health = Math.max(0, target.health - 150);
                        target.sprite.setVelocityY(-500);
                    }
                    // Efecto de impacto
                    this.cameras.main.shake(200, 0.03);
                    if (meteor && meteor.destroy) meteor.destroy();
                    else if (meteor && meteor.scene) meteor.destroy();
                    // Liberar el lock de "charge" exactamente al terminar la caída
                    try {
                        const player = this.players[i];
                        if (player) { player._lockedAction = null; player.actionLockUntil = 0; }
                    } catch (e) { /* ignore */ }
                }
            });

            player.sofiaMeteorBuffer = [];
        }
    }
        

        handleSofiaRobo(i, time) {
        if (this.mode === 'cooperativo') return; // disable PvP Sofia robo in coop
            const player = this.players[i];
            const sprite = player.sprite;
            if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;
            // check two buffers: laser and teleport sequences to detect L,L,X or R,R,X
            let roboTriggered = false;
        function check(buf) { return buf && buf.length === 3 && ((buf[0].k === 'L' && buf[1].k === 'L' && buf[2].k === 'X') || (buf[0].k === 'R' && buf[1].k === 'R' && buf[2].k === 'X')); }
        if (check(player.sofiaLaserBuffer) || check(player.sofiaTeleportBuffer) || check(player.sofiaMeteorBuffer)) roboTriggered = true;
            if (roboTriggered) {
                const charIdx = (i === 0) ? this.player1Index : this.player2Index;
                const roboKey = `char${charIdx}_robo`;
                if (this.anims.exists(roboKey)) {
                    try { sprite.anims.play(roboKey, false); } catch (e) { }
                } else if (this.textures.exists(roboKey)) {
                    try { sprite.setTexture(roboKey); sprite.setFrame(0); } catch (e) { }
                }
                // clear buffers
                if (player.sofiaLaserBuffer) player.sofiaLaserBuffer = [];
                if (player.sofiaTeleportBuffer) player.sofiaTeleportBuffer = [];
            }
        }

    handleFranchescaEnergy(i, time) {
        if (this.mode === 'cooperativo') return; // disable PvP Franchesca energy attacks in coop
        const player = this.players[i];
        const sprite = player.sprite;

        // Solo Franchesca (índice 2 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 2) || (i === 1 && this.player2Index !== 2)) return;

        // Detectar si el botón de golpear está pulsado
        let punchHeld = false;
        // Teclado
        if (i === 0) punchHeld = this.keysP1.hit.isDown;
        else punchHeld = this.keysP2.hit.isDown;
        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected && pad.buttons[2]) punchHeld = punchHeld || pad.buttons[2].pressed;

        // Si la habilidad está activa, aplica daño constante y consume energía
        if (player.franchescaEnergyActive) {
            // No puede moverse mientras la habilidad está activa
            sprite.setVelocityX(0);

            if (player.energy >= 100 * (this.game.loop.delta / 1000)) {
                player.energy = Math.max(0, player.energy - 100 * (this.game.loop.delta / 1000));
                const target = this.players[1 - i];
                const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);
                // SOLO daña si el enemigo NO está bloqueando
                if (dist <= 200 && !target.blocking) {
                    const dt = this.game.loop.delta / 1000;
                    target.health = Math.max(0, target.health -   15 * dt);
                }
                // Efecto visual: círculo de energía
                if (!player._energyCircle || !player._energyCircle.scene) {
                    player._energyCircle = this.add.circle(sprite.x, sprite.y, 200, 0xff00cc, 0.13).setDepth(8);
                } else {
                    player._energyCircle.x = sprite.x;
                    player._energyCircle.y = sprite.y;
                }

                // Si suelta el botón, programa desactivación en 0.7s
                if (!punchHeld) {
                    if (!player.franchescaEnergyDeactivateTime) {
                        player.franchescaEnergyDeactivateTime = time + 700;
                    }
                } else {
                    player.franchescaEnergyDeactivateTime = null;
                }

                // Termina si se queda sin energía o pasa el tiempo de desactivación
                if (player.energy <= 0 || (player.franchescaEnergyDeactivateTime && time > player.franchescaEnergyDeactivateTime)) {
                    player.franchescaEnergyActive = false;
                    player.franchescaEnergyDeactivateTime = null;
                    if (player._energyCircle && player._energyCircle.scene) player._energyCircle.destroy();
                }
            } else {
                player.franchescaEnergyActive = false;
                player.franchescaEnergyDeactivateTime = null;
                if (player._energyCircle && player._energyCircle.scene) player._energyCircle.destroy();
            }
            return;
        }

        // Detectar secuencia: IZQ, DER, GOLPE (en menos de 1s entre cada uno)
        if (player.energy < 100) {
            player.franchescaEnergyBuffer = [];
            return;
        }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        // Gamepad
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX < -0.7 && !pad._franLeft) { input = "L"; pad._franLeft = true; }
            if (axisX > 0.7 && !pad._franRight) { input = "R"; pad._franRight = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._franLeft = pad._franRight = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franHit) { input = "X"; pad._franHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franHit = false;
        }

        if (input) {
            const now = time;
            if ( player.franchescaEnergyBuffer.length === 0 || (now - (player.franchescaEnergyBuffer[player.franchescaEnergyBuffer.length - 1].t)) < 1000) {
                player.franchescaEnergyBuffer.push({ k: input, t: now });
                if (player.franchescaEnergyBuffer.length > 3) player.franchescaEnergyBuffer.shift();
            } else {
                player.franchescaEnergyBuffer = [{ k: input, t: now }];
            }
        }

        // Verifica la secuencia
        if (
            player.franchescaEnergyBuffer.length === 3 &&
            player.franchescaEnergyBuffer[0].k === "L" &&
            player.franchescaEnergyBuffer[1].k === "R" &&
            player.franchescaEnergyBuffer[2].k === "X"
        ) {
            // Activa la habilidad
            player.franchescaEnergyActive = true;
            player.franchescaEnergyDeactivateTime = null;
            player.franchescaEnergyBuffer = [];
        }
    }

    handleFranchescaJumpSlash(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;

       
        // Solo Franchesca (índice 2 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 2) || (i === 1 && this.player2Index !== 2)) return;

        // Si la habilidad está pendiente, no puede moverse ni hacer nada
        if (player.franchescaJumpPending) {
            sprite.setVelocityX(0);
            
            // Reproducir animación de ataque aéreo si está disponible
            if (this.textures.exists('fran_air_aoe') && this.anims.exists('fran_air_aoe')) {
                if (!player.franAoeOverlay) {
                    const aoeSprite = this.add.sprite(sprite.x, sprite.y, 'fran_air_aoe', 0).setDepth(sprite.depth + 1);
                    aoeSprite.setOrigin(0.5, 0.5);
                    aoeSprite.flipX = sprite.flipX;
                    aoeSprite.play('fran_air_aoe');
                    player.franAoeOverlay = aoeSprite;
                    // Ocultar sprite base
                    try { sprite.setAlpha(0); } catch (e) { }
                }
                // Seguir jugador con overlay
                if (player.franAoeOverlay && player.franAoeOverlay.active) {
                    player.franAoeOverlay.x = sprite.x;
                    player.franAoeOverlay.y = sprite.y;
                    player.franAoeOverlay.flipX = sprite.flipX;
                }
            }
            
            // Espera el timer para el corte
            if (time > player.franchescaJumpTimer) {
                player.franchescaJumpPending = false;
                
                // Destruir overlay de AoE
                if (player.franAoeOverlay && player.franAoeOverlay.scene) {
                    player.franAoeOverlay.destroy();
                    player.franAoeOverlay = null;
                }
                // Restaurar visibilidad
                try { sprite.setAlpha(1); } catch (e) { }
                // Ataque en área
                const target = this.players[1 - i];
                const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);
                // Efecto visual: círculo de corte
                const slashCircle = this.add.circle(sprite.x, sprite.y, 300, 0xff00cc, 0.18).setDepth(9);
                this.cameras.main.shake(180, 0.02);

                // Daño si el enemigo no está bloqueando
                if (dist <= 300 && !target.blocking) {
                    target.health = Math.max(0, target.health - 250);
                }

                // Eliminar el círculo después de 0.4s
                this.time.delayedCall(400, () => {
                    if (slashCircle && slashCircle.scene) slashCircle.destroy();
                });

                if (sprite.clearTint) sprite.clearTint(); // Restaurar colores originales
            }
            return;
        }

        // Detectar secuencia: DERECHA, IZQUIERDA, GOLPE (en menos de 1s entre cada uno)
        if (player.energy < 250) {
            player.franchescaJumpBuffer = [];
            return;
        }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX > 0.7 && !pad._franJumpRight) { input = "R"; pad._franJumpRight = true; }
            if (axisX < -0.7 && !pad._franJumpLeft) { input = "L"; pad._franJumpLeft = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._franJumpLeft = pad._franJumpRight = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franJumpHit) { input = "X"; pad._franJumpHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franJumpHit = false;
        }

        if (input) {
            const now = time;
            if (player.franchescaJumpBuffer.length === 0 || (now - (player.franchescaJumpBuffer[player.franchescaJumpBuffer.length - 1].t)) < 1000) {
                player.franchescaJumpBuffer.push({ k: input, t: now });
                if (player.franchescaJumpBuffer.length > 3) player.franchescaJumpBuffer.shift();
            } else {
                player.franchescaJumpBuffer = [{ k: input, t: now }];
            }
        }

        // Verifica la secuencia
        if (
            player.franchescaJumpBuffer.length === 3 &&
            player.franchescaJumpBuffer[0].k === "R" &&
            player.franchescaJumpBuffer[1].k === "L" &&
            player.franchescaJumpBuffer[2].k === "X"
        ) {
            // Gasta energía y realiza el salto
            player.energy = Math.max(0, player.energy - 250);
            player.franchescaJumpPending = true;
            player.franchescaJumpTimer = time + 700; // 0.7 segundos de salto antes del corte
            sprite.setVelocityY(-520); // Salto rápido
            sprite.setTint(0xff99ff); // Color especial durante la habilidad
            player.franchescaJumpBuffer = [];
        }
    }

    // --- NUEVO: Habilidad de robo de Franchesca (DER, DER, GOLPE) ---
    handleFranchescaSteal(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Sólo Franchesca (índice 2)
        if ((i === 0 && this.player1Index !== 2) || (i === 1 && this.player2Index !== 2)) return;

        if (!player.franchescaLaserBuffer) player.franchescaLaserBuffer = [];
        if (player.energy < 300) { player.franchescaLaserBuffer = []; return; }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }

        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX > 0.7 && !pad._franStealRight) { input = "R"; pad._franStealRight = true; }
            if (axisX > -0.7 && axisX < 0.7) pad._franStealRight = false;
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franStealHit) { input = "X"; pad._franStealHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franStealHit = false;
        }

        if (input) {
            const now = time;
            if (player.franchescaLaserBuffer.length === 0 || (now - (player.franchescaLaserBuffer[player.franchescaLaserBuffer.length - 1].t)) < 1000) {
                player.franchescaLaserBuffer.push({ k: input, t: now });
                if (player.franchescaLaserBuffer.length > 3) player.franchescaLaserBuffer.shift();
            } else {
                player.franchescaLaserBuffer = [{ k: input, t: now }];
            }
        }

        // Define lista de habilidades robables del objetivo (nombre, coste)
        const target = this.players[1 - i];
        const stealable = [];
        // Charles (0)
        if (this.player1Index === 0 || this.player2Index === 0) { /* not used */ }
        // construir según target character
        const targetCharIndex = (1 - i) === 0 ? this.player1Index : this.player2Index;
        if (targetCharIndex === 0) { // Charles
            stealable.push({ id: 'charSpecial', cost: 150 });
            stealable.push({ id: 'charTransform', cost: 300 });
            stealable.push({ id: 'charExplosion', cost: 180 });
        } else if (targetCharIndex === 1) { // Sofía
            stealable.push({ id: 'sofiaLaser', cost: 100 });
            stealable.push({ id: 'sofiaTeleport', cost: 100 });
            stealable.push({ id: 'sofiaMeteor', cost: 250 });
        } else if (targetCharIndex === 2) { // Franchesca
            stealable.push({ id: 'franEnergy', cost: 100 });
            stealable.push({ id: 'franJump', cost: 250 });
            // do not include steal to avoid recursion
        } else {
            // por defecto, dejar alguna habilidad genérica
            stealable.push({ id: 'genericHit', cost: 100 });
        }

        // Secuencia R,R,X -> roba la habilidad (sin laser)
        if (
            player.franchescaLaserBuffer.length === 3 &&
            player.franchescaLaserBuffer[0].k === "R" &&
            player.franchescaLaserBuffer[1].k === "R" &&
            player.franchescaLaserBuffer[2].k === "X"
        ) {
            // Mostrar frame 2 estático durante robo
            if (this.textures.exists('char2_punch')) {
                try {
                    sprite.setTexture('char2_punch');
                    sprite.setFrame(2);
                } catch (e) { /* ignore */ }
            }
            
            // Si el objetivo está bloqueando, no roba
            if (target.blocking) {
                this.cameras.main.flash(120, 80, 80, 80);
            } else {
                // seleccionar habilidad aleatoria del objetivo
                const choice = stealable[Math.floor(Math.random() * stealable.length)];
                if (choice) {
                    player.energy = Math.max(0, player.energy - 300);
                    // asignar habilidad al ladrón por 30s
                    player.franchescaStolenAbility = { name: choice.id, cost: choice.cost, source: (1 - i), timer: time + 30000 };
                    player.franchescaStolenTimer = player.franchescaStolenAbility.timer;
                    // marcar en el objetivo que perdió esa habilidad (solo esa)
                    target.stolenAbilities = target.stolenAbilities || {};
                    target.stolenAbilitiesTimers = target.stolenAbilitiesTimers || {};
                    target.stolenAbilities[choice.id] = true;
                    target.stolenAbilitiesTimers[choice.id] = time + 30000;

                    // feedback visual
                    if (target.sprite && target.sprite.setTint) target.sprite.setTint(0x444444);
                    if (player.sprite && player.sprite.setTint) player.sprite.setTint(0xffcc88);
                    this.cameras.main.flash(140, 255, 200, 50);
                }
            }
            player.franchescaLaserBuffer = [];
        }
    }

    // NUEVO handler que permite al ladrón usar la habilidad robada con L,L,X
    handleFranchescaUseStolen(i, time) {
        const player = this.players[i];
        if (!player || !player.franchescaStolenAbility) return;
        const sprite = player.sprite;
        const ability = player.franchescaStolenAbility;
        const pad = getPad(player.padIndex, this);

        // Input buffer L,L,X
        let input = null;
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX < -0.7 && !pad._franUseLeft) { input = "L"; pad._franUseLeft = true; }
            if (axisX > -0.7 && axisX < 0.7) pad._franUseLeft = false;
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franUseHit) { input = "X"; pad._franUseHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franUseHit = false;
        }

        if (input) {
            const now = time;
            if (player.franchescaUseBuffer.length === 0 || (now - (player.franchescaUseBuffer[player.franchescaUseBuffer.length - 1].t)) < 1000) {
                player.franchescaUseBuffer.push({ k: input, t: now });
                if (player.franchescaUseBuffer.length > 3) player.franchescaUseBuffer.shift();
            } else {
                player.franchescaUseBuffer = [{ k: input, t: now }];
            }
        }

        if (
            player.franchescaUseBuffer.length === 3 &&
            player.franchescaUseBuffer[0].k === "L" &&
            player.franchescaUseBuffer[1].k === "L" &&
            player.franchescaUseBuffer[2].k === "X"
        ) {
            // usar la habilidad robada (sin consumirla; la misma puede usarse dentro del tiempo)
            if (player.energy < ability.cost) {
                // not enough energy: feedback
                this.cameras.main.flash(120, 80, 80, 80);
            } else {
                const target = this.players[1 - i];
                // ejecutar efectos según ability.name
                switch (ability.name) {
                    case 'sofiaLaser':
                        player.energy = Math.max(0, player.energy - ability.cost);
                        if (!target.blocking) {
                            target.health = Math.max(0, target.health - 10);
                            // atraer
                            const offset = 60;
                            target.sprite.x = sprite.x + (target.sprite.x < sprite.x ? -offset : offset);
                            target.sprite.y = sprite.y;
                            target.sprite.setVelocity(0, 0);
                        }
                        break;
                    case 'sofiaTeleport':
                        player.energy = Math.max(0, player.energy - ability.cost);
                        // teleport thief near target and damage
                        {
                            const offset = 60;
                            sprite.x = target.sprite.x + (sprite.x < target.sprite.x ? -offset : offset);
                            sprite.y = target.sprite.y;
                            sprite.setVelocity(0, 0);
                            if (!target.blocking) target.health = Math.max(0, target.health - 30);
                        }
                        break;
                    case 'sofiaMeteor':
                        player.energy = Math.max(0, player.energy - ability.cost);
                        {
                            const meteor = this.add.circle(target.sprite.x, target.sprite.y - 400, 38, 0xff3300).setDepth(10);
                            this.tweens.add({
                                targets: meteor,
                                y: target.sprite.y,
                                duration: 500,
                                ease: 'Quad.easeIn',
                                onComplete: () => {
                                    if (!target.blocking) {
                                        target.health = Math.max(0, target.health - 150);
                                        target.sprite.setVelocityY(-500);
                                    }
                                    this.cameras.main.shake(200, 0.03);
                                    meteor.destroy();
                                }
                            });
                        }
                        break;
                    case 'charSpecial':
                        player.energy = Math.max(0, player.energy - ability.cost);
                        if (!target.blocking) {
                            target.health = Math.max(0, target.health - 65);
                            const dir = (target.sprite.x > sprite.x) ? 1 : -1;
                            target.sprite.setVelocity(600 * dir, -120);
                        }
                        break;
                    case 'charTransform':
                        player.energy = Math.max(0, player.energy - ability.cost);
                        player.transformed = true;
                        player.transformTimer = time + 8000;
                        break;
                    case 'charExplosion':
                        player.energy = Math.max(0, player.energy - ability.cost);
                        if (!target.blocking) {
                            target.health = Math.max(0, target.health - 90);
                            target.sprite.setVelocityY(-400);
                        } else {
                            target.health = Math.max(0, target.health - 30);
                            target.sprite.setVelocityY(-120);
                        }
                        break;
                    case 'franEnergy':
                        player.energy = Math.max(0, player.energy - ability.cost);
                        if (!target.blocking) target.health = Math.max(0, target.health - 15);
                        break;
                    case 'franJump':
                        player.energy = Math.max(0, player.energy - ability.cost);
                        if (!target.blocking) target.health = Math.max(0, target.health - 250);
                        break;
                    default:
                        // generic fallback
                        player.energy = Math.max(0, player.energy - ability.cost);
                        if (!target.blocking) target.health = Math.max(0, target.health - Math.floor(ability.cost / 2));
                        break;
                }
            }
            // limpiar buffer de uso
            player.franchescaUseBuffer = [];
        }
    }

    // NUEVA: Habilidad de Mario - rayo atravesador (IZQ, DER, GOLPE) - ahora láser instantáneo
    handleMarioBeam(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Mario es índice 3 en el selector de personajes
        if ((i === 0 && this.player1Index !== 3) || (i === 1 && this.player2Index !== 3)) return;

        if (!player.marioBeamBuffer) player.marioBeamBuffer = [];
        if (player.energy < 150) { player.marioBeamBuffer = []; return; }

        let input = null;
        // Teclado
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }

        // Gamepad
        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX < -0.7 && !pad._marioLeft) { input = "L"; pad._marioLeft = true; }
            if (axisX > 0.7 && !pad._marioRight) { input = "R"; pad._marioRight = true; }
            if (axisX > -0.7 && axisX < 0.7) pad._marioLeft = pad._marioRight = false;
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._marioHit) { input = "X"; pad._marioHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._marioHit = false;
        }

        if (input) {
            const now = time;
            if (player.marioBeamBuffer.length === 0 || (now - (player.marioBeamBuffer[player.marioBeamBuffer.length - 1].t)) < 1000) {
                player.marioBeamBuffer.push({ k: input, t: now });
                if (player.marioBeamBuffer.length > 3) player.marioBeamBuffer.shift();
            } else {
                player.marioBeamBuffer = [{ k: input, t: now }];
            }
        }

        // Verifica la secuencia L,R,X
        if (
            player.marioBeamBuffer.length === 3 &&
            player.marioBeamBuffer[0].k === "L" &&
            player.marioBeamBuffer[1].k === "R" &&
            player.marioBeamBuffer[2].k === "X"
        ) {
            // Gasta energía
            player.energy = Math.max(0, player.energy - 150);

            // Crear sprite del láser con animación
            const sx = sprite.x + (sprite.flipX ? -20 : 20);
            const sy = sprite.y - 10;
            
            const laserSprite = this.add.sprite(sx, sy, 'mario_laser_sangre', 0);
            laserSprite.setOrigin(0, 0.5);
            laserSprite.setDepth(50);
            laserSprite.flipX = sprite.flipX;
            
            // Reproducir animación de alargamiento
            if (this.anims.exists('mario_laser_sangre')) {
                laserSprite.play('mario_laser_sangre');
            }
            
            // Extender el láser en la dirección del jugador
            const direction = sprite.flipX ? -1 : 1;
            const maxReach = 800; // alcance máximo del láser
            
            // Daño base
            const baseDamage = 100;
            const hitWidth = 60; // ancho del hitbox del láser
            
            // En modo cooperativo, dañar enemigos y jefe
            if (this.mode === 'cooperativo') {
                // Dañar enemigos
                if (this.enemies) {
                    this.enemies.children.entries.forEach(enemy => {
                        if (!enemy.active) return;
                        
                        const distX = Math.abs(enemy.x - sx);
                        const distY = Math.abs(enemy.y - sy);
                        const inRange = (direction > 0) ? (enemy.x > sx && enemy.x < sx + maxReach) : (enemy.x < sx && enemy.x > sx - maxReach);
                        
                        if (inRange && distY < hitWidth) {
                            enemy.health -= baseDamage;
                            
                            // Empuje
                            enemy.setVelocityX(400 * direction);
                            enemy.setVelocityY(-100);
                            
                            // Destruir si muere
                            if (enemy.health <= 0) {
                                if (enemy.healthBar) enemy.healthBar.destroy();
                                if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                                enemy.destroy();
                                this.checkWaveComplete();
                            }
                        }
                    });
                }
                
                // Dañar jefe
                if (this.bossActive && this.boss) {
                    const distX = Math.abs(this.boss.x - sx);
                    const distY = Math.abs(this.boss.y - sy);
                    const inRange = (direction > 0) ? (this.boss.x > sx && this.boss.x < sx + maxReach) : (this.boss.x < sx && this.boss.x > sx - maxReach);
                    
                    if (inRange && distY < hitWidth) {
                        this.boss.health = Math.max(0, this.boss.health - 15); // Cap de 15 como melee
                        
                        // Empuje
                        if (this.boss.body) {
                            this.boss.body.setVelocity(220 * direction, -120);
                        }
                        
                        // Flash visual
                        const flash = this.add.circle(this.boss.x, this.boss.y, 30, 0xff3300, 0.8).setDepth(10);
                        this.tweens.add({
                            targets: flash,
                            alpha: 0,
                            scale: 2,
                            duration: 300,
                            onComplete: () => { try { flash.destroy(); } catch (e) {} }
                        });
                    }
                }
            } else {
                // Modo PvP: dañar al otro jugador
                const target = this.players[1 - i];
                if (target && target.sprite) {
                    const distX = Math.abs(target.sprite.x - sx);
                    const distY = Math.abs(target.sprite.y - sy);
                    const inRange = (direction > 0) ? (target.sprite.x > sx && target.sprite.x < sx + maxReach) : (target.sprite.x < sx && target.sprite.x > sx - maxReach);
                    
                    if (inRange && distY < hitWidth) {
                        if (!target.blocking) {
                            target.health = Math.max(0, target.health - baseDamage);
                        } else {
                            target.health = Math.max(0, target.health - Math.floor(baseDamage * 0.35));
                        }
                        target.beingHit = true;
                        target.hitTimer = this.time.now + 300;
                        
                        if (!target.blocking) {
                            target.sprite.setVelocityX(180 * direction);
                        }
                    }
                }
            }

            // Feedback visual
            this.cameras.main.flash(120, 255, 200, 80);
            
            // Destruir el sprite del láser después de la animación
            laserSprite.once('animationcomplete', () => {
                try { laserSprite.destroy(); } catch (e) {}
            });
            
            // Fallback por si no hay animación
            this.time.delayedCall(1000, () => {
                if (laserSprite && laserSprite.scene) laserSprite.destroy();
            });

            // Limpiar buffer
            player.marioBeamBuffer = [];
        }
    }

    handleMarioExplosion(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Mario es índice 3 en el selector de personajes
        if ((i === 0 && this.player1Index !== 3) || (i === 1 && this.player2Index !== 3)) return;

        if (!player.marioExplBuffer) player.marioExplBuffer = [];
        if (player.energy < 150) { player.marioExplBuffer = []; return; }

        // detectar input (R, L, X)
        let input = null;
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }

        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX > 0.7 && !pad._marioExplRight) { input = "R"; pad._marioExplRight = true; }
            if (axisX < -0.7 && !pad._marioExplLeft) { input = "L"; pad._marioExplLeft = true; }
            if (axisX > -0.7 && axisX < 0.7) pad._marioExplRight = pad._marioExplLeft = false;
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._marioExplHit) { input = "X"; pad._marioExplHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._marioExplHit = false;
        }

        if (input) {
            const now = time;
            if (player.marioExplBuffer.length === 0 || (now - (player.marioExplBuffer[player.marioExplBuffer.length - 1].t)) < 1000) {
                player.marioExplBuffer.push({ k: input, t: now });
                if (player.marioExplBuffer.length > 3) player.marioExplBuffer.shift();
            } else {
                player.marioExplBuffer = [{ k: input, t: now }];
            }
        }

        // secuencia R, L, X
        if (
            player.marioExplBuffer.length === 3 &&
            player.marioExplBuffer[0].k === "R" &&
            player.marioExplBuffer[1].k === "L" &&
            player.marioExplBuffer[2].k === "X"
        ) {
            // consumir energía
            player.energy = Math.max(0, player.energy - 150);

            const RADIUS = 200;
            const DAMAGE = 80;

            // Crear animación de agua en la posición de Mario (como "granada" de agua)
            if (this.textures.exists('mario_agua') && this.anims.exists('mario_agua')) {
                const aguaY = sprite.y + (sprite.height ? sprite.height/2 : 32);
                const agua = this.add.sprite(sprite.x, aguaY, 'mario_agua', 0).setDepth(20);
                agua.setOrigin(0.5, 0.9);
                agua.setScale(3); // Área grande como la habilidad
                agua.play('mario_agua');
                agua.once('animationcomplete', () => {
                    if (agua && agua.scene) agua.destroy();
                });
            }

            // visual y feedback adicional
            this.cameras.main.shake(180, 0.02);
            this.cameras.main.flash(100, 160, 200, 255);

            // aplicar efecto a todos los enemigos (atraviesa)
            for (let j = 0; j < this.players.length; j++) {
                if (j === i) continue;
                const target = this.players[j];
                if (!target || !target.sprite) continue;
                const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);
                if (d <= RADIUS) {
                    // empujar muy lejos con tiro parabólico (mitad del mapa)
                    const nx = (target.sprite.x - sprite.x) / Math.max(1, d);
                    // Empuje horizontal muy fuerte (mitad del mapa = ~400-500px)
                    const pushX = nx * 1200; // Empuje horizontal muy fuerte
                    const pushY = -600; // Empuje vertical alto para parábola
                    target.sprite.setVelocity(pushX, pushY);

                    // daño (reduce si bloquea)
                    if (!target.blocking) {
                        target.health = Math.max(0, target.health - DAMAGE);
                    } else {
                        target.health = Math.max(0, target.health - Math.floor(DAMAGE * 0.35));
                    }

                    // stun corto
                    target.beingHit = true;
                    target.hitTimer = this.time.now + 400;
                }
            }

            // limpiar buffer
            player.marioExplBuffer = [];
        }
    }

    // NUEVA: Habilidad de Mario - smash gigante (DER, DER, GOLPE)
    handleMarioSmash(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Mario es índice 3 en el selector de personajes
        if ((i === 0 && this.player1Index !== 3) || (i === 1 && this.player2Index !== 3)) return;

        if (!player.marioSmashBuffer) player.marioSmashBuffer = [];
        if (player.energy < 250) { player.marioSmashBuffer = []; return; }

        // Detect input
        let input = null;
        if (i === 0) {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
        }

        const pad = getPad(player.padIndex, this);
        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (axisX > 0.7 && !pad._marioSmashRight) { input = "R"; pad._marioSmashRight = true; }
            if (axisX > -0.7 && axisX < 0.7) pad._marioSmashRight = false;
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._marioSmashHit) { input = "X"; pad._marioSmashHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._marioSmashHit = false;
        }

        if (input) {
            const now = time;
            if (player.marioSmashBuffer.length === 0 || (now - (player.marioSmashBuffer[player.marioSmashBuffer.length - 1].t)) < 1000) {
                player.marioSmashBuffer.push({ k: input, t: now });
                if (player.marioSmashBuffer.length > 3) player.marioSmashBuffer.shift();
            } else {
                player.marioSmashBuffer = [{ k: input, t: now }];
            }
        }

        // Verifica la secuencia R, R, X
        if (
            player.marioSmashBuffer.length === 3 &&
            player.marioSmashBuffer[0].k === "R" &&
            player.marioSmashBuffer[1].k === "R" &&
            player.marioSmashBuffer[2].k === "X"
        ) {
            // Consume energy
            player.energy = Math.max(0, player.energy - 250);

            // Objetivo: el enemigo opuesto
            const target = this.players[1 - i];
            if (!target || !target.sprite) { player.marioSmashBuffer = []; return; }

            // Crear sprite de bola de agua muy grande que cae desde arriba (animación fall: frames 0-6)
            if (this.textures.exists('mario_bola_agua') && this.anims.exists('mario_bola_agua_fall')) {
                const aguaStartY = target.sprite.y - 600; // empieza bien arriba
                const agua = this.add.sprite(target.sprite.x, aguaStartY, 'mario_bola_agua', 0).setDepth(20);
                agua.setOrigin(0.5, 0.5);
                agua.setScale(3.5); // Muy grande
                agua.play('mario_bola_agua_fall'); // Animación de caída (frames 0-6 en loop)

                // Usar tween para que caiga
                this.tweens.add({
                    targets: agua,
                    y: target.sprite.y,
                    duration: 500,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        // Al impactar, cambiar a animación de impacto (frames 7-13)
                        if (agua && agua.scene && this.anims.exists('mario_bola_agua_impact')) {
                            agua.play('mario_bola_agua_impact');
                            agua.once('animationcomplete', () => {
                                if (agua && agua.scene) agua.destroy();
                            });
                        } else if (agua && agua.scene) {
                            agua.destroy();
                        }

                        // Impacto: aplicar daño 180 si no bloquea, o daño reducido si bloquea
                        const DAMAGE = 180;
                        if (!target.blocking) {
                            target.health = Math.max(0, target.health - DAMAGE);
                            target.sprite.setVelocityY(-420);
                        } else {
                            target.health = Math.max(0, target.health - Math.floor(DAMAGE * 0.35));
                            target.sprite.setVelocityY(-120);
                        }
                        // Efecto de cámara
                        this.cameras.main.shake(260, 0.04);
                        this.cameras.main.flash(120, 200, 220, 255);
                    }
                });
            }

            // limpiar buffer
            player.marioSmashBuffer = [];
        }
    }
}

// --- ESCENA VICTORIA ---
export class VictoryScene extends Phaser.Scene {
    constructor() { super('VictoryScene'); }
    init(data) {
        this.player1Index = data.player1Index ?? 0;
        this.player2Index = data.player2Index ?? 1;
        this.mode = data.mode || 'cooperativo';
    }
    create() {
        // No música de menú en la pantalla de victoria
        stopMenuMusic(this);
        // Detener música de batalla
        stopBattleMusic(this);
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x003311);
        
        // Victory title
        this.add.text(width/2, 120, '¡VICTORIA!', { font: '64px Arial', color: '#44ff44' }).setOrigin(0.5);
        this.add.text(width/2, 200, '¡Derrotaron al jefe!', { font: '36px Arial', color: '#ffffff' }).setOrigin(0.5);

        // Buttons
        const buttonW = 260, buttonH = 64, spacing = 30;
        const bx = width/2;
        let by = height - 160;

        this.buttons = [];

        const restartBtn = this.add.rectangle(bx - (buttonW + spacing), by, buttonW, buttonH, 0x004466).setInteractive();
        const restartTxt = this.add.text(restartBtn.x, restartBtn.y, 'REINICIAR', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: restartBtn, txt: restartTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // Evitar eliminar texturas aquí — pueden estar en uso por otras escenas.
            // Si es necesario, limpiar sólo imágenes/objetos en la escena activa.
            this.scene.stop('VictoryScene');
            // Small delay for clean state
            this.time.delayedCall(100, () => {
                this.scene.start('GameScene', { player1Index: this.player1Index, player2Index: this.player2Index, mode: this.mode, map: 'Mapa 1' });
            });
        }});

        const charSelBtn = this.add.rectangle(bx, by, buttonW, buttonH, 0x003355).setInteractive();
        const charSelTxt = this.add.text(charSelBtn.x, charSelBtn.y, 'SELECCIONAR PERSONAJE', { font: '18px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: charSelBtn, txt: charSelTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // Evitar eliminar texturas aquí — pueden estar en uso por otras escenas.
            this.scene.stop('VictoryScene');
            // Small delay for clean state
            this.time.delayedCall(100, () => {
                this.scene.start('CharacterSelector', { mode: this.mode });
            });
        }});

        const menuBtn = this.add.rectangle(bx + (buttonW + spacing), by, buttonW, buttonH, 0x002244).setInteractive();
        const menuTxt = this.add.text(menuBtn.x, menuBtn.y, 'MENU', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: menuBtn, txt: menuTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // Evitar eliminar texturas aquí — pueden estar en uso por otras escenas.
            this.scene.stop('VictoryScene');
            // Small delay for clean state
            this.time.delayedCall(100, () => {
                this.scene.start('Menu');
            });
        }});

        // Selector visual
        this.selector = this.add.rectangle(this.buttons[0].rect.x, this.buttons[0].rect.y, buttonW + 12, buttonH + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5);
        this.selectedIndex = 0;

        // Input keys
        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        // Gamepad support
        this.input.gamepad.on('connected', pad => { pad._leftPressed = pad._rightPressed = pad._aPressed = false; });

        // Pointer handling
        this.buttons.forEach((b, idx) => {
            b.rect.on('pointerdown', () => {
                try {
                    const cb = this.buttons && this.buttons[idx] && this.buttons[idx].callback;
                    if (typeof cb === 'function') cb();
                } catch (e) {
                    console.warn('Menu button callback failed:', e);
                }
            });
        });
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

// --- ESCENA GAME OVER ---
export class GameOver extends Phaser.Scene {
    constructor() { super('GameOver'); }
    init(data) {
        this.winnerIndex = data.winnerIndex ?? 0;
        this.winnerChar = data.winnerChar ?? 0;
        this.player1Index = data.player1Index ?? 0;
        this.player2Index = data.player2Index ?? 1;
        this.mode = data.mode || 'versus';
    }
    create() {
        // No música de menú en Game Over
        stopMenuMusic(this);
        stopBattleMusic(this);
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x001d33);
        
        // Si es modo cooperativo, mostrar "PERDIERON" sin jugador específico
        if (this.mode === 'cooperativo') {
            this.add.text(width/2, 120, 'FIN DEL JUEGO', { font: '64px Arial', color: '#ff4444' }).setOrigin(0.5);
            this.add.text(width/2, 200, '¡PERDIERON!', { font: '36px Arial', color: '#ffffff' }).setOrigin(0.5);
        } else {
            // Modo versus: mostrar el ganador
            const winnerName = this.winnerIndex === 0 ? (['Charles','Sofia','Franchesca','Mario'][this.player1Index] || 'Player 1') : (['Charles','Sofia','Franchesca','Mario'][this.player2Index] || 'Player 2');
            this.add.text(width/2, 120, 'FIN DEL JUEGO', { font: '64px Arial', color: '#ff4444' }).setOrigin(0.5);
            this.add.text(width/2, 200, `${winnerName} ganó!`, { font: '36px Arial', color: '#ffffff' }).setOrigin(0.5);
        }

        // Buttons
        const buttonW = 260, buttonH = 64, spacing = 30;
        const bx = width/2;
        let by = height - 160;

        this.buttons = [];

        const restartBtn = this.add.rectangle(bx - (buttonW + spacing), by, buttonW, buttonH, 0x004466).setInteractive();
        const restartTxt = this.add.text(restartBtn.x, restartBtn.y, isEnglish ? 'RESTART' : 'REINICIAR', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: restartBtn, txt: restartTxt, callback: () => {
            // Reiniciar: detener escenas y reiniciar GameScene
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // Evitar eliminar texturas aquí — pueden estar en uso por otras escenas.
            this.scene.stop('GameOver');
            // Small delay to ensure clean state
            this.time.delayedCall(100, () => {
                this.scene.start('GameScene', { player1Index: this.player1Index, player2Index: this.player2Index, mode: this.mode, map: 'Mapa 1' });
            });
        }});

        const charSelBtn = this.add.rectangle(bx, by, buttonW, buttonH, 0x003355).setInteractive();
        const charSelTxt = this.add.text(charSelBtn.x, charSelBtn.y, isEnglish ? 'CHAR SELECT' : 'SELECCIONAR PERSONAJE', { font: '18px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: charSelBtn, txt: charSelTxt, callback: () => {
            // Ir a selector de personaje: detener GameScene/HudScene primero
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // Evitar eliminar texturas aquí — pueden estar en uso por otras escenas.
            this.scene.stop('GameOver');
            // Small delay for clean state
            this.time.delayedCall(100, () => {
                this.scene.start('CharacterSelector', { mode: this.mode });
            });
        }});

        const menuBtn = this.add.rectangle(bx + (buttonW + spacing), by, buttonW, buttonH, 0x002244).setInteractive();
        const menuTxt = this.add.text(menuBtn.x, menuBtn.y, isEnglish ? 'MENU' : 'MENU', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: menuBtn, txt: menuTxt, callback: () => {
            // Volver al menú: detener escenas primero
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // Evitar eliminar texturas aquí — pueden estar en uso por otras escenas.
            this.scene.stop('GameOver');
            // Small delay for clean state
            this.time.delayedCall(100, () => {
                this.scene.start('Menu');
            });
        }});

        // Selector visual
        this.selector = this.add.rectangle(this.buttons[0].rect.x, this.buttons[0].rect.y, buttonW + 12, buttonH + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5);
        this.selectedIndex = 0;

        // Input keys
        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        // Gamepad support
        this.input.gamepad.on('connected', pad => { pad._leftPressed = pad._rightPressed = pad._aPressed = false; });

        // Pointer handling
        this.buttons.forEach((b, idx) => {
            b.rect.on('pointerdown', () => {
                try {
                    const cb = this.buttons && this.buttons[idx] && this.buttons[idx].callback;
                    if (typeof cb === 'function') cb();
                } catch (e) {
                    console.warn('Menu button callback failed:', e);
                }
            });
        });
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

