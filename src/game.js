// Configuración principal del juego
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    input: {
        keyboard: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 350 },
            debug: false
        }
    },
    // En lugar de tener las funciones aquí, ahora usamos escenas
    scene: [BootScene, MenuScene, GameScene]
};

// Iniciar el juego
const game = new Phaser.Game(config);

// Variables globales del juego (si son necesarias)
const gameState = {
    score: 0,
    highScore: 0,
    // Otras variables globales que quieras compartir entre escenas
};