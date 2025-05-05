class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.on('complete', () => {
            console.log('Todos los assets cargados correctamente');
        });
        
        // Cargar textura de plataforma primero
        this.load.image('ground', 'assets/platform.png');
        // Aquí cargamos todos los assets
        this.load.image('sky', 'assets/Clouds1.png');
        this.load.image('ground', 'assets/platform.png');

        // Assets del gato
        this.load.spritesheet('cat_idle', 'assets/cat_white_idle.png', { frameWidth: 134.8, frameHeight: 95 });
        this.load.spritesheet('cat_run', 'assets/cat_white_run.png', { frameWidth: 135, frameHeight: 95 });
        this.load.spritesheet('cat_jump', 'assets/cat_white_jump.png', { frameWidth: 130, frameHeight: 95 });

        // Aquí puedes añadir una barra de progreso de carga si quieres
        const loadingBar = this.add.graphics();
        const loadingText = this.add.text(400, 300, 'Cargando...', { 
            font: '24px Arial', 
            fill: '#ffffff' 
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            loadingBar.clear();
            loadingBar.fillStyle(0xffffff, 1);
            loadingBar.fillRect(250, 340, 300 * value, 30);
        });

        this.load.on('complete', () => {
            loadingBar.destroy();
            loadingText.destroy();
        });
    }

    create() {
        // Una vez cargados todos los assets, pasamos a la escena del menú
        this.scene.start('MenuScene');
    }
}