class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Fondo
        this.add.image(400, 300, 'sky').setScale(2);

        // Título del juego
        this.add.text(400, 150, 'Gato Aventura', {
            font: '48px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Botón para empezar el juego
        const startButton = this.add.text(400, 300, 'COMENZAR', {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        // Pequeña animación al pasar el ratón
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ff0' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#ffffff' });
        });

        // Al hacer clic empezamos el juego
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // También se puede empezar con la tecla Enter o Espacio
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        // Mostrar mensaje
        this.add.text(400, 450, 
            'lorem ipsum dolor sit amet, consectetur adipiscing elit. Juego hecho para alguien...', 
            {
            font: '16px Arial',
            fill: '#8D0AFC'
        }).setOrigin(0.5);
    }
}