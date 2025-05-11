class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Crear el sprite del jugador
        this.sprite = scene.physics.add.sprite(x, y, 'cat_idle').setScale(0.5);
        this.sprite.setCollideWorldBounds(true);
        
        // Configurar la hitbox
        const hitboxConfig = {
            width: 30,
            height: 60,
            offsetRight: 30,
            offsetLeft: 75,
            offsetY: 35
        };
        
        this.sprite.setSize(hitboxConfig.width, hitboxConfig.height);
        this.sprite.setOffset(hitboxConfig.offsetRight, hitboxConfig.offsetY);
        this.sprite.setOrigin(0.5, 1);
        
        // Método para voltear la hitbox cuando cambia la dirección
        this.sprite.flipCharacter = function(flip) {
            this.flipX = flip;
            this.body.setOffset(
                flip ? hitboxConfig.offsetLeft : hitboxConfig.offsetRight,
                hitboxConfig.offsetY
            );
        };
        
        // Límites de velocidad
        this.sprite.body.setMaxVelocity(300, 500);
        this.sprite.setVelocityX(0);
        this.sprite.setDragX(500);

        // Configurar la gravedad base
        this.sprite.body.setGravityY(1500);
        
        // Variables para el control de animaciones
        this.minFallVelocity = 50;
        this.wasFalling = false;
        this.isLanding = false;
        this.wasInAir = false;
        this.stableGroundTime = 0;
        this.STABLE_GROUND_THRESHOLD = 50;
        this.MIN_FALL_VELOCITY = 150;
        this.lastVelocityY = 0;
        this.stableFrames = 0;
        this.STABLE_FRAMES_THRESHOLD = 5;
        
        // Variables para Coyote Time
        this.coyoteTime = 180; // milisegundos que el jugador puede saltar después de caer
        this.coyoteTimeCounter = 0;
        this.hasLeftGround = false;
        this._canJump = true; // Flag para controlar si puede saltar
        
        // Variables para salto variable
        this.jumpVelocity = -350;
        this.jumpTime = 0;
        this.maxJumpTime = 900; // tiempo máximo que se puede mantener el salto (ms)
        this.minJumpVelocity = -150; // velocidad mínima para un "tap jump"
        this._isJumping = false;
        this.jumpReleased = true;
        this.gravity = 900; // aceleración de caída normal
        this.fallGravity = 900; // aceleración de caída rápida (cuando se suelta el botón)
        
        // Variables para movimiento
        this._acceleration = 800;
        this._maxSpeed = 300;
        // Buffer de entrada para salto
        this.jumpBuffer = 400; // milisegundos para recordar la pulsación de salto
        this.jumpBufferCounter = 0;
        

        // Crear animaciones
        this.createAnimations();
        
        // Controles
        this.cursors = scene.input.keyboard.createCursorKeys();
        
        // Información de debug
        this.debug = {
            isOnFloor: false,
            canJump: true,
            coyoteTimeCounter: 0,
            jumpBufferCounter: 0
        };
    }
    
    createAnimations() {
        // Animación de reposo
        if (!this.scene.anims.exists('stay')) {
            this.scene.anims.create({
                key: 'stay',
                frames: this.scene.anims.generateFrameNumbers('cat_idle', { start: 0, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Animación de correr
        if (!this.scene.anims.exists('run')) {
            this.scene.anims.create({
                key: 'run',
                frames: this.scene.anims.generateFrameNumbers('cat_run', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Animación de salto
        if (!this.scene.anims.exists('jump')) {
            this.scene.anims.create({
                key: 'jump',
                frames: this.scene.anims.generateFrameNumbers('cat_jump', { start: 0, end: 2 }),
                frameRate: 20,
                repeat: 0
            });
        }
        
        // Animación de caída
        if (!this.scene.anims.exists('fall')) {
            this.scene.anims.create({
                key: 'fall',
                frames: this.scene.anims.generateFrameNumbers('cat_jump', { start: 3, end: 6 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Animación de aterrizaje
        if (!this.scene.anims.exists('touchDown')) {
            this.scene.anims.create({
                key: 'touchDown',
                frames: this.scene.anims.generateFrameNumbers('cat_jump', { start: 7, end: 9 }),
                frameRate: 15,
                repeat: 0
            });
        }
    }
    
    update(time, delta) {
        // Convertir delta a segundos para cálculos de física
        const dt = delta / 1000;
        
        // Verificar si está en el suelo de manera estable
        const isOnFloor = this.checkStableGround();
   
        
        // Actualizar Coyote Time y Jump Buffer
        this.updateCoyoteTime(isOnFloor, delta);
        this.updateJumpBuffer(delta);
        
        // Detectar si está cayendo
        if (!isOnFloor && this.sprite.body.velocity.y > this.minFallVelocity) {
            this.wasFalling = true;
        }
        
        // Movimiento horizontal
        if (this.cursors.left.isDown) {
            this.sprite.setAccelerationX(-this.acceleration);
            this.sprite.flipCharacter(true);
        } else if (this.cursors.right.isDown) {
            this.sprite.setAccelerationX(this.acceleration);
            this.sprite.flipCharacter(false);
        } else {
            this.sprite.setAccelerationX(0);
            if (Math.abs(this.sprite.body.velocity.x) < 5) {
                this.sprite.setVelocityX(0);
            }
        }
        
        // Límite de velocidad
        if (Math.abs(this.sprite.body.velocity.x) > this.maxSpeed) {
            this.sprite.setVelocityX(this.maxSpeed * Math.sign(this.sprite.body.velocity.x));
        }
        
        // Detectar cuando se presiona y se suelta el botón de salto
        const justPressedJump = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const justReleasedJump = Phaser.Input.Keyboard.JustUp(this.cursors.up);
        
        // Agregar pulsación al buffer de salto
        if (justPressedJump) {
            this.jumpBufferCounter = this.jumpBuffer;
        }
        
        // Intentar saltar si hay buffer de salto y puede saltar
        if (this.jumpBufferCounter > 0 && (isOnFloor || this.canCoyoteJump()) && !this.isLanding) {
            this.startJump();
            this.jumpBufferCounter = 0; // Consumir el buffer
        }
        
        // Controlar la duración del salto
        if (this.isJumping) {
            if (this.cursors.up.isDown && this.jumpTime < this.maxJumpTime) {
                // Mantener la velocidad de salto mientras se presiona
                this.jumpTime += delta;
                
                // Aplicar la velocidad de salto como una fuerza constante
                this.sprite.setVelocityY(this.jumpVelocity);
            } else {
                // Terminar el salto si se suelta el botón o se excede el tiempo máximo
                this.isJumping = false;
                
                // Si estamos en fase ascendente y soltamos el botón, aplicar el minJumpVelocity
                if (this.sprite.body.velocity.y < 0 && this.sprite.body.velocity.y < this.minJumpVelocity) {
                    this.sprite.body.velocity.y = this.minJumpVelocity;
                }
            }
        }
        
        // Aplicar gravedad variable
        if (!isOnFloor) {
            // Gravedad normal durante el salto, gravedad aumentada durante la caída
            if (this.sprite.body.velocity.y > 0 || !this.cursors.up.isDown) {
                this.sprite.body.setGravityY(this.fallGravity);
            } else {
                this.sprite.body.setGravityY(this.gravity);
            }
        } else {
            // Resetear la capacidad de saltar cuando toca el suelo
            this.canJump = true;
        }
        
        // Verificar si se soltó el botón de salto
        if (justReleasedJump) {
            this.jumpReleased = true;
        }
        
        // Gestión de animaciones
        this.updateAnimations(isOnFloor);
        
        // Actualizar el tiempo de contacto con el suelo
        if (isOnFloor) {
            this.stableGroundTime += delta;
            this.hasLeftGround = false;  // Resetear la bandera cuando toca suelo
        } else {
            this.stableGroundTime = 0;
        }
        
        // Actualizar la última velocidad Y para el próximo frame
        this.lastVelocityY = this.sprite.body.velocity.y;
        
        // Actualizar información de debug
        this.updateDebugInfo(isOnFloor);
    }
    
    updateDebugInfo(isOnFloor) {
        this.debug.isOnFloor = isOnFloor;
        this.debug.canJump = this.canJump;
        this.debug.coyoteTimeCounter = this.coyoteTimeCounter;
        this.debug.jumpBufferCounter = this.jumpBufferCounter;
    }
    
    updateCoyoteTime(isOnFloor, delta) {
        // Si estaba en el suelo y ahora está en el aire, comenzar Coyote Time
        if (isOnFloor) {
            this.coyoteTimeCounter = this.coyoteTime;
        } else {
            if (!this.hasLeftGround) {
                this.hasLeftGround = true;
            }
            
            // Reducir el contador de Coyote Time solo si ha dejado el suelo
            if (this.hasLeftGround && this.coyoteTimeCounter > 0) {
                this.coyoteTimeCounter -= delta;
            }
        }
    }
    
    updateJumpBuffer(delta) {
        // Reducir el contador de buffer de salto
        if (this.jumpBufferCounter > 0) {
            this.jumpBufferCounter -= delta;
        }
    }
    
    canCoyoteJump() {
        // Puede saltar si hay tiempo de coyote disponible
        return this.coyoteTimeCounter > 0 && this.hasLeftGround && this.canJump;
    }
    
    startJump() {
        // Evitar saltos múltiples
        if (!this.canJump) return;
        
        this.isJumping = true;
        this.jumpTime = 0;
        this.canJump = false; // Evitar saltos múltiples hasta tocar el suelo
        this.sprite.setVelocityY(this.jumpVelocity);
        this.sprite.anims.play('jump', true);
        this.wasInAir = true;
        
        // Resetear el contador de coyote time
        this.coyoteTimeCounter = 0;
    }
    
    updateAnimations(isOnFloor) {
        // Si está en el aire
        if (!isOnFloor) {
            this.wasInAir = true;
            
            if (!this.isLanding) {
                if (this.sprite.body.velocity.y < 0) {
                    // Subiendo en el salto
                    if (this.sprite.anims.currentAnim?.key !== 'jump') {
                        this.sprite.anims.play('jump', true);
                    }
                } else if (this.sprite.body.velocity.y > this.MIN_FALL_VELOCITY) {
                    // Cayendo
                    if (this.sprite.anims.currentAnim?.key !== 'fall') {
                        this.sprite.anims.play('fall', true);
                    }
                    this.wasFalling = true;
                }
            }
        } else {
            // Si está en el suelo
            if (this.wasFalling && !this.isLanding && this.stableGroundTime > this.STABLE_GROUND_THRESHOLD) {
                // Aterrizaje
                this.isLanding = true;
                this.wasFalling = false;
                this.sprite.anims.play('touchDown', true);
                
                // Al terminar la animación de aterrizaje
                this.sprite.on('animationcomplete-touchDown', () => {
                    this.isLanding = false;
                    this.updateIdleRunAnimation();
                }, this);
            } else if (!this.isLanding && this.stableGroundTime > this.STABLE_GROUND_THRESHOLD) {
                // Reposo o corriendo
                this.updateIdleRunAnimation();
            }
        }
    }
    
    updateIdleRunAnimation() {
        if (this.sprite.body.velocity.x === 0) {
            this.sprite.anims.play('stay', true);
        } else {
            this.sprite.anims.play('run', true);
        }
    }
    
    checkStableGround() {
        const currentFloorCheck = this.sprite.body.blocked.down || this.sprite.body.touching.down;
        
        if (currentFloorCheck) {
            this.stableFrames++;
        } else {
            this.stableFrames = 0;
        }
        
        return this.stableFrames >= this.STABLE_FRAMES_THRESHOLD;
    }
        // GETTERS
    get position() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    get velocity() {
        return {
            x: this.sprite.body.velocity.x,
            y: this.sprite.body.velocity.y
        };
    }

    get isOnGround() {
        return this.checkStableGround();
    }

    get acceleration() {
        return this._acceleration;
    }

    get maxSpeed() {
        return this._maxSpeed;
    }

    // SETTERS (como propiedades)
    set position({x, y}) {
        this.sprite.setPosition(x, y);
    }

    set velocity({x, y}) {
        if (x !== undefined) this.sprite.setVelocityX(x);
        if (y !== undefined) this.sprite.setVelocityY(y);
    }

    set acceleration(value) {
        if (typeof value === 'number' && value >= 0) {
            this._acceleration = value;
        }
    }

    set maxSpeed(value) {
        if (typeof value === 'number' && value > 0) {
            this._maxSpeed = value;
        }
    }

    
    // Método para depuración (opcional)
    showDebugInfo() {
        const debugInfo = [
            `En suelo: ${this.debug.isOnFloor}`,
            `Puede saltar: ${this.debug.canJump}`,
            `Coyote Time: ${Math.floor(this.debug.coyoteTimeCounter)}ms`,
            `Jump Buffer: ${Math.floor(this.debug.jumpBufferCounter)}ms`
        ];
        
        return debugInfo.join('\n');
    }
}