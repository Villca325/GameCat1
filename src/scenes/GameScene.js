class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // debug
        this.physics.world.createDebugGraphic();
        this.physics.world.drawDebug = true;
        // Crear el generador de mundo
        this.worldGenerator = new WorldGenerator(this);
        this.worldGenerator.setup(); // Esto creará las plataformas iniciales
        
        // Luego crear al jugador
        this.player = new Player(this, 250, 500); // Posición sobre la plataforma inicial
        // Configurar cámara para seguir al jugador
        this.cameras.main.setBounds(0, 0, this.worldGenerator.worldWidth, 600);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(100, 50);  // Añadir deadzone
        // Establecer colisiones entre el jugador y las plataformas
        this.physics.add.collider(this.player.sprite, this.worldGenerator.getPlatforms());
        
        // Configurar sistema de puntuación
        this.score = 0;
        this.highestX = 0;
        
        // Texto para mostrar la puntuación
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setScrollFactor(0);
        
        // Agregar texto de depuración (opcional)
        this.debugText = this.add.text(10, 50, '', { 
            font: '16px Arial', 
            fill: '#ffffff',
            backgroundColor: '#000000'
        }).setScrollFactor(0).setVisible(false);
        
        // Tecla para activar/desactivar depuración (D)
        this.input.keyboard.on('keydown-D', () => {
            this.debugText.visible = !this.debugText.visible;
            // También puedes activar/desactivar la depuración física
            this.physics.world.drawDebug = this.debugText.visible;
            this.physics.world.debugGraphic.clear();
        });
    }

    update(time, delta) {

            // Verificar que el jugador y su sprite existan
    if (!this.player || !this.player.sprite) return;
    
    // Actualizar el jugador
    this.player.update(time, delta);
    
    // Actualizar el generador de mundo con verificación
    if (this.worldGenerator && this.player.sprite.body) {
        this.worldGenerator.update(this.player.sprite.x);
    }
        // Actualizar el jugador
        this.player.update(time, delta);
        
        // Actualizar el generador de mundo
        this.worldGenerator.update(this.player.sprite.x);
        
        // Actualizar puntuación basada en la distancia
        if (this.player.sprite.x > this.highestX) {
            this.highestX = this.player.sprite.x;
            this.score = Math.floor(this.highestX);
            this.scoreText.setText(`Score: ${this.score}`);
        }
        
        // Actualizar información de depuración
        this.updateDebugInfo();
        
        // Comprobar si el jugador ha caído
        if (this.player.sprite.y > this.cameras.main.height) {
            this.gameOver();
        }
    }
    
    updateDebugInfo() {
        if (this.debugText.visible) {
            this.debugText.setText([
                `FPS: ${Math.round(this.game.loop.actualFps)}`,
                `Posición jugador: (${Math.floor(this.player.sprite.x)}, ${Math.floor(this.player.sprite.y)})`,
                `Velocidad: (${Math.floor(this.player.sprite.body.velocity.x)}, ${Math.floor(this.player.sprite.body.velocity.y)})`,
                `Última plataforma: ${Math.floor(this.worldGenerator.lastPlatformX)}`,
                `Ancho del mundo: ${this.worldGenerator.worldWidth}`,
                `Estado: ${this.player.wasFalling ? 'CAYENDO' : (this.player.isLanding ? 'ATERRIZANDO' : 
                    this.player.stableGroundTime > this.player.STABLE_GROUND_THRESHOLD ? 'SUELO_FIRME' : 'SUELO_INESTABLE')}`,
                `Animación: ${this.player.sprite.anims.currentAnim?.key || 'NINGUNA'}`
            ]);
        }
    }
    
    gameOver() {
        // Puedes mostrar un texto de fin de juego
        this.add.text(this.cameras.main.worldView.centerX, 300, 'GAME OVER', {
            fontSize: '64px',
            fill: '#fff',
            stroke: '#f00',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.add.text(this.cameras.main.worldView.centerX, 380, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Botón para volver a jugar
        const restartButton = this.add.text(this.cameras.main.worldView.centerX, 450, 'Jugar de nuevo', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setInteractive();
        
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
        
        // Detener el juego
        this.physics.pause();
        this.player.sprite.setTint(0xff0000);
    }
}