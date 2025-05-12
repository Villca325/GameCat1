class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.isGameOver = false;

    // debug
    this.physics.world.createDebugGraphic();
    this.physics.world.drawDebug = false;

    //musica y sonido
this.music = this.sound.add('music1', {
    volume: 1,
    loop: true
});
this.music.play();

    this.meow1=this.sound.add("meow1", {
      volume: 0.1,
      loop: false,
    });


    // Crear el generador de mundo
    this.worldGenerator = new WorldGenerator(this);
    this.worldGenerator.setup(); // Esto creará las plataformas iniciales

    // Luego crear al jugador
    this.player = new Player(this, 250, 400); // Posición sobre la plataforma inicial
    // Configurar cámara para seguir al jugador
    this.cameras.main.setBounds(0, 0, this.worldGenerator.worldWidth, 600);
    //no seguir al jugador  this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(100, 50); // Añadir deadzone
    // Establecer colisiones entre el jugador y las plataformas
    this.physics.add.collider(
      this.player.sprite,
      this.worldGenerator.getPlatforms()
    );

    // Configurar sistema de puntuación
    this.score = 0;
    this.highestX = 0;

    // Texto para mostrar la puntuación
    this.scoreText = this.add
      .text(16, 16, "Score: 0", {
        fontSize: "24px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setScrollFactor(0);

    // Agregar texto de depuración (opcional)
    this.debugText = this.add
      .text(10, 50, "", {
        font: "16px Arial",
        fill: "#ffffff",
        backgroundColor: "#000000",
      })
      .setScrollFactor(0)
      .setVisible(false);

    // Tecla para activar/desactivar depuración (D)
    this.input.keyboard.on("keydown-D", () => {
      this.debugText.visible = !this.debugText.visible;
      // También puedes activar/desactivar la depuración física
      this.physics.world.drawDebug = this.debugText.visible;
      this.physics.world.debugGraphic.clear();
    });

    //pared invisible
    // Crear una barrera invisible a la izquierda de la cámara
    this.leftWall = this.physics.add
      .staticImage(this.cameras.main.scrollX - 50, 0, null)
      .setOrigin(0, 0)
      .setDisplaySize(10, this.scale.height)
      .refreshBody()
      .setVisible(false); // Puedes ponerlo en true para debug visual

    // Activar colisión del jugador con la pared
    this.physics.add.collider(this.player.sprite, this.leftWall);

    // movimiento de camara
    this.cameraSpeed = 60; // velocidad inicial en píxeles por segundo
    this.maxCameraSpeed = 400;
    this.speedIncreaseRate = 2; // velocidad a la que aumenta cada segundo
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
      this.score = Math.floor(this.highestX) - 250;
      this.scoreText.setText(`Score: ${this.score}`);
    }

    // Actualizar información de depuración
    this.updateDebugInfo();

    // Comprobar si el jugador ha caído
    if (this.player.sprite.y >= 599 && !this.isGameOver) {
      console.log("Jugador cayó. Activando gameOver");
      this.gameOver();
      this.isGameOver = true;
    }
    // Comprobar si el jugador ha alcanzado el límite
    const cameraLeftEdge = this.cameras.main.scrollX;
    if (this.player.sprite.x < cameraLeftEdge - 50 && !this.isGameOver) {
      console.log("Jugador fuera de cámara por la izquierda. Game over.");
      this.gameOver();
      this.isGameOver = true;
    }
    //pared invisible
    this.leftWall.x = this.cameras.main.scrollX - 50;
    this.leftWall.refreshBody();
    //movimiento de camara
    // Aumentar la velocidad de la cámara con el tiempo
    this.cameraSpeed = Math.min(
      this.cameraSpeed + this.speedIncreaseRate * (delta / 1000),
      this.maxCameraSpeed
    );

    // Mover la cámara automáticamente hacia la derecha
    this.cameras.main.scrollX += this.cameraSpeed * (delta / 1000);
    this.player.acceleration += 0.01;

  }

  updateDebugInfo() {
    if (this.debugText.visible) {
      this.debugText.setText([
        `FPS: ${Math.round(this.game.loop.actualFps)}`,
        `Velocidad cámara: ${Math.floor(this.cameraSpeed)}`,
        `Posición jugador: (${Math.floor(this.player.sprite.x)}, ${Math.floor(
          this.player.sprite.y
        )})`,
        `Velocidad: (${Math.floor(
          this.player.sprite.body.velocity.x
        )}, ${Math.floor(this.player.sprite.body.velocity.y)})`,
        `Aceleración: ${Math.floor(this.player.acceleration)}`,
        `Última plataforma: ${Math.floor(this.worldGenerator.lastPlatformX)}`,
        `Ancho del mundo: ${this.worldGenerator.worldWidth}`,
        `Estado: ${
          this.player.wasFalling
            ? "CAYENDO"
            : this.player.isLanding
            ? "ATERRIZANDO"
            : this.player.stableGroundTime > this.player.STABLE_GROUND_THRESHOLD
            ? "SUELO_FIRME"
            : "SUELO_INESTABLE"
        }`,
        `Animación: ${this.player.sprite.anims.currentAnim?.key || "NINGUNA"}`,
      ]);
    }
  }
  gameOver() {
    // Detener seguimiento y física
    this.cameraSpeed = 0;
    this.maxCameraSpeed = 0;
    this.meow1.play();
    this.cameras.main.stopFollow();
    this.physics.pause();

    // Aplicar tinte rojo al jugador
    this.player.sprite.setTint(0xff0000);

    // Efecto de sacudida de cámara
    this.cameras.main.shake(200, 0.01);
    //apagar musica si GameOver musica
    if (this.music && this.music.isPlaying) {
    this.music.stop();
    }
    // SOLUCIÓN: Crear una escena UI superpuesta para la pantalla de Game Over
    // En lugar de agregar elementos a la escena actual, creamos una nueva escena UI

    // Primero, asegurarnos de que la escena de Game Over existe y está configurada correctamente
    if (!this.scene.get("GameOverScene")) {
      // Definir la escena GameOver
      class GameOverScene extends Phaser.Scene {
        constructor() {
          super({ key: "GameOverScene" });
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
          const overlay = this.add
            .rectangle(
              0,
              0,
              this.cameras.main.width * 2,
              this.cameras.main.height * 2,
              0x000000,
              0.7
            )
            .setOrigin(0);

          // Crear el contenedor de Game Over
          const gameOverContainer = this.add.container(centerX, centerY);

          // Añadir elementos al contenedor
          const gameOverText = this.add
            .text(0, 0, "GAME OVER", {
              fontSize: "64px",
              fill: "#fff",
              stroke: "#f00",
              strokeThickness: 8,
            })
            .setOrigin(0.5);

          const scoreText = this.add
            .text(0, 80, `Score: ${this.score}`, {
              fontSize: "32px",
              fill: "#fff",
            })
            .setOrigin(0.5);

          const restartButton = this.add
            .text(0, 160, "Reintentar", {
              fontSize: "28px",
              fill: "#fff",
              backgroundColor: "#d34545",
              padding: { x: 20, y: 10 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

          const menuButton = this.add
            .text(0, 220, "MENU", {
              fontSize: "20px",
              fill: "#fff",
              backgroundColor: "#60E750",
              padding: { x: 20, y: 5 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

          gameOverContainer.add([
            gameOverText,
            scoreText,
            restartButton,
            menuButton,
          ]);

          // Interacciones del botón
          restartButton.on("pointerover", () =>
            restartButton.setStyle({
              fill: "#ff0",
              backgroundColor: "#d34545",
              padding: { x: 20, y: 10 },
            })
          );

          restartButton.on("pointerout", () =>
            restartButton.setStyle({
              fill: "#fff",
              backgroundColor: "#d34545",
              padding: { x: 20, y: 10 },
            })
          );
          menuButton.on("pointerover", () =>
            menuButton.setStyle({
              fill: "#ff0",
              backgroundColor: "#60E750",
              padding: { x: 20, y: 5 },
            })
          );

          restartButton.on("pointerdown", () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
              // Cerrar esta escena
              this.scene.stop();
              // Reiniciar la escena principal
              this.parentScene.scene.restart();
            });
          });
          menuButton.on("pointerdown", () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
              // Cerrar esta escena
              this.scene.stop();
              // Volver a la escena del menú
              this.parentScene.scene.stop();
              this.scene.start("MenuScene");
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
            ease: "Back.out",
          });
        }
      }

      // Registrar la escena si aún no existe
      this.scene.add("GameOverScene", GameOverScene, false);
    }

    // Iniciar la escena de Game Over
    this.scene.launch("GameOverScene", {
      parentScene: this,
      score: this.score,
    });
  }
}
