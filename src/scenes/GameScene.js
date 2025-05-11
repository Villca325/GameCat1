class GameScene extends Phaser.Scene {
  
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
    this.isGameOver = false;
       
    
        // debug
        this.physics.world.createDebugGraphic();
        this.physics.world.drawDebug = false;
   
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
            this.score = Math.floor(this.highestX)-250 ;
            this.scoreText.setText(`Score: ${this.score}`);
        }
        
        // Actualizar información de depuración
        this.updateDebugInfo();
        

        
        // Comprobar si el jugador ha caído
        if ( this.player.sprite.y >=599 && !this.isGameOver)  {
           console.log('Jugador cayó. Activando gameOver');
            this.gameOver();
              this.isGameOver = true;
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
    // Detener seguimiento y física
    this.cameras.main.stopFollow();
    this.physics.pause();
    
    // Aplicar tinte rojo al jugador
    this.player.sprite.setTint(0xff0000);
    
    // Efecto de sacudida de cámara
    this.cameras.main.shake(200, 0.01);
    
    // SOLUCIÓN: Crear una escena UI superpuesta para la pantalla de Game Over
    // En lugar de agregar elementos a la escena actual, creamos una nueva escena UI
    
    // Primero, asegurarnos de que la escena de Game Over existe y está configurada correctamente
    if (!this.scene.get('GameOverScene')) {
        // Definir la escena GameOver
        class GameOverScene extends Phaser.Scene {
            constructor() {
                super({ key: 'GameOverScene' });
                this.parentScene = null;
                this.score = 0;
            }
            
            init(data) {
                this.parentScene = data.parentScene;
                this.score = data.score;
            }
            
            create() {
                const centerX = this.cameras.main.width / 2;
                const centerY = this.cameras.main.height / 2;
                
                // Añadir un fondo semi-transparente
                const overlay = this.add.rectangle(
                    0, 0, 
                    this.cameras.main.width * 2, 
                    this.cameras.main.height * 2, 
                    0x000000, 0.7
                ).setOrigin(0);
                
                // Crear el contenedor de Game Over
                const gameOverContainer = this.add.container(centerX, centerY);
                
                // Añadir elementos al contenedor
                const gameOverText = this.add.text(0, 0, 'GAME OVER', {
                    fontSize: '64px',
                    fill: '#fff',
                    stroke: '#f00',
                    strokeThickness: 8
                }).setOrigin(0.5);
                
                const scoreText = this.add.text(0, 80, `Score: ${this.score}`, {
                    fontSize: '32px',
                    fill: '#fff'
                }).setOrigin(0.5);
                
                const restartButton = this.add.text(0, 160, 'Reintentar', {
                    fontSize: '28px',
                    fill: '#fff',
                    backgroundColor: '#d34545',
                    padding: { x: 20, y: 10 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                
                gameOverContainer.add([gameOverText, scoreText, restartButton]);
                
                // Interacciones del botón
                restartButton.on('pointerover', () => restartButton.setStyle({ 
                    fill: '#ff0',
                    backgroundColor: '#d34545',
                    padding: { x: 20, y: 10 } 
                }));
                
                restartButton.on('pointerout', () => restartButton.setStyle({ 
                    fill: '#fff',
                    backgroundColor: '#d34545',
                    padding: { x: 20, y: 10 } 
                }));
                
                restartButton.on('pointerdown', () => {
                    this.cameras.main.fadeOut(300, 0, 0, 0);
                    this.time.delayedCall(300, () => {
                        // Cerrar esta escena
                        this.scene.stop();
                        // Reiniciar la escena principal
                        this.parentScene.scene.restart();
                    });
                });
                
                // Animación de entrada
                gameOverContainer.setAlpha(0);
                gameOverContainer.y += 30; // Posición inicial para la animación
                this.tweens.add({
                    targets: gameOverContainer,
                    y: gameOverContainer.y - 30,
                    alpha: 1,
                    duration: 500,
                    ease: 'Back.out'
                });
            }
        }
        
        // Registrar la escena si aún no existe
        this.scene.add('GameOverScene', GameOverScene, false);
    }
    
    // Iniciar la escena de Game Over
    this.scene.launch('GameOverScene', { 
        parentScene: this,
        score: this.score
    });
}
}