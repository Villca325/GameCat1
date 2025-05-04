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
        
        // Crear animaciones
        this.createAnimations();
        
        // Controles
        this.cursors = scene.input.keyboard.createCursorKeys();
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
        // Verificar si está en el suelo de manera estable
        const isOnFloor = this.checkStableGround();
        const acceleration = 800;
        const maxSpeed = 300;
        
        // Detectar si está cayendo
        if (!isOnFloor && this.sprite.body.velocity.y > this.minFallVelocity) {
            this.wasFalling = true;
        }
        
        // Movimiento horizontal
        if (this.cursors.left.isDown) {
            this.sprite.setAccelerationX(-acceleration);
            this.sprite.flipCharacter(true);
        } else if (this.cursors.right.isDown) {
            this.sprite.setAccelerationX(acceleration);
            this.sprite.flipCharacter(false);
        } else {
            this.sprite.setAccelerationX(0);
            if (Math.abs(this.sprite.body.velocity.x) < 5) {
                this.sprite.setVelocityX(0);
            }
        }
        
        // Límite de velocidad
        if (Math.abs(this.sprite.body.velocity.x) > maxSpeed) {
            this.sprite.setVelocityX(maxSpeed * Math.sign(this.sprite.body.velocity.x));
        }
        
        // Salto
        if (this.cursors.up.isDown && isOnFloor && !this.isLanding) {
            this.sprite.setVelocityY(-350);
            this.sprite.anims.play('jump', true);
            this.wasInAir = true;
        }
        
        // Gestión de animaciones
        this.updateAnimations(isOnFloor);
        
        // Actualizar el tiempo de contacto con el suelo
        if (isOnFloor) {
            this.stableGroundTime += delta;
        } else {
            this.stableGroundTime = 0;
        }
        
        // Actualizar la última velocidad Y para el próximo frame
        this.lastVelocityY = this.sprite.body.velocity.y;
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
    
    // Método para obtener la posición actual
    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }
}