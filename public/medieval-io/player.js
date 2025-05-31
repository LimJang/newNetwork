/**
 * Medieval.io Player Class
 * 플레이어 엔티티와 물리, 애니메이션을 관리합니다.
 */

class Player {
    /**
     * 플레이어 생성자
     * @param {Phaser.Scene} scene - Phaser 씬
     * @param {number} x - 초기 X 위치
     * @param {number} y - 초기 Y 위치
     * @param {string} playerId - 플레이어 ID
     * @param {boolean} isLocal - 로컬 플레이어 여부
     */
    constructor(scene, x, y, playerId, isLocal = false) {
        this.scene = scene;
        this.playerId = playerId;
        this.isLocal = isLocal;
        
        // 플레이어 상태
        this.health = GAME_CONFIG.PLAYER.HEALTH;
        this.maxHealth = GAME_CONFIG.PLAYER.HEALTH;
        this.state = PLAYER_STATES.IDLE;
        this.direction = 'down';
        this.lastDirection = 'down';
        
        // 색상 설정
        this.color = SpriteGenerator.getPlayerColor(this.getPlayerIndex());
        this.spriteKey = SpriteGenerator.getSpriteKey(this.color);
        
        // 스프라이트 생성
        this.sprite = scene.physics.add.sprite(x, y, this.spriteKey);
        this.sprite.setSize(SPRITE_CONFIG.KNIGHT.WIDTH - 8, SPRITE_CONFIG.KNIGHT.HEIGHT - 8);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDrag(300); // 마찰력
        this.sprite.setMaxVelocity(GAME_CONFIG.PLAYER.SPEED);
        
        // 플레이어 정보 표시
        this.createNameTag();
        this.createHealthBar();
        
        // 무기 (검)
        this.weapon = null;
        this.createWeapon();
        
        // 입력 관리 (로컬 플레이어만)
        if (this.isLocal) {
            this.inputManager = new InputManager(scene, this);
        }
        
        // 애니메이션 상태
        this.currentAnimation = null;
        this.isMoving = false;
        this.attackCooldown = 0;
        
        // 보간을 위한 변수들
        this.targetX = x;
        this.targetY = y;
        this.interpolationSpeed = 0.1;
        
        console.log(`👤 Player ${playerId} created at (${x}, ${y})`);
    }
    
    /**
     * 플레이어 인덱스를 반환합니다 (색상 선택용)
     * @returns {number} 플레이어 인덱스
     */
    getPlayerIndex() {
        return parseInt(this.playerId.slice(-3)) % 8; // 간단한 해시
    }
    
    /**
     * 이름표를 생성합니다
     */
    createNameTag() {
        this.nameText = this.scene.add.text(0, 0, `Knight_${this.getPlayerIndex()}`, {
            fontSize: '12px',
            fontFamily: 'Cinzel',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        this.nameText.setOrigin(0.5, 1);
    }
    
    /**
     * 체력바를 생성합니다
     */
    createHealthBar() {
        // 체력바 배경
        this.healthBarBg = this.scene.add.rectangle(0, 0, 30, 4, 0x000000);
        this.healthBarBg.setStrokeStyle(1, 0xffffff);
        
        // 체력바
        this.healthBar = this.scene.add.rectangle(0, 0, 28, 2, 0x00ff00);
        this.healthBar.setOrigin(0, 0.5);
    }
    
    /**
     * 무기를 생성합니다
     */
    createWeapon() {
        this.weapon = this.scene.add.sprite(0, 0, 'sword');
        this.weapon.setOrigin(0.5, 1);
        this.weapon.setScale(0.8);
        this.weapon.setVisible(false); // 공격시에만 표시
    }
    
    /**
     * 플레이어를 업데이트합니다
     * @param {number} deltaTime - 프레임 시간
     */
    update(deltaTime) {
        // 로컬 플레이어 입력 처리
        if (this.isLocal && this.inputManager) {
            this.inputManager.update(deltaTime);
        } else {
            // 원격 플레이어는 보간 처리
            this.interpolateToTarget();
        }
        
        // 위치 기반 UI 업데이트
        this.updateUIPositions();
        
        // 애니메이션 업데이트
        this.updateAnimation();
        
        // 무기 위치 업데이트
        this.updateWeaponPosition();
        
        // 공격 쿨다운 감소
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime * 1000; // 밀리초 단위로 변환
        }
    }
    
    /**
     * 원격 플레이어의 위치를 보간합니다
     */
    interpolateToTarget() {
        const deltaX = this.targetX - this.sprite.x;
        const deltaY = this.targetY - this.sprite.y;
        
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            this.sprite.x += deltaX * this.interpolationSpeed;
            this.sprite.y += deltaY * this.interpolationSpeed;
            this.setMoving(true);
        } else {
            this.setMoving(false);
        }
    }
    
    /**
     * UI 요소들의 위치를 업데이트합니다
     */
    updateUIPositions() {
        const x = this.sprite.x;
        const y = this.sprite.y;
        
        // 이름표 위치
        this.nameText.setPosition(x, y - 25);
        
        // 체력바 위치
        this.healthBarBg.setPosition(x, y - 20);
        this.healthBar.setPosition(x - 14, y - 20);
        
        // 체력바 크기 업데이트
        const healthPercentage = this.health / this.maxHealth;
        this.healthBar.setSize(28 * healthPercentage, 2);
        
        // 체력에 따른 색상 변경
        if (healthPercentage > 0.6) {
            this.healthBar.setFillStyle(0x00ff00); // 녹색
        } else if (healthPercentage > 0.3) {
            this.healthBar.setFillStyle(0xffff00); // 노란색
        } else {
            this.healthBar.setFillStyle(0xff0000); // 빨간색
        }
    }
    
    /**
     * 애니메이션을 업데이트합니다
     */
    updateAnimation() {
        let newAnimation = null;
        
        if (this.state === PLAYER_STATES.ATTACKING) {
            // 공격 애니메이션은 별도 처리
            return;
        } else if (this.isMoving) {
            newAnimation = this.spriteKey + '_walk';
        } else {
            newAnimation = this.spriteKey + '_idle';
        }
        
        // 애니메이션 변경이 필요한 경우
        if (this.currentAnimation !== newAnimation) {
            this.currentAnimation = newAnimation;
            this.sprite.anims.play(newAnimation, true);
        }
        
        // 방향에 따른 스프라이트 뒤집기
        if (this.direction === 'left') {
            this.sprite.setFlipX(true);
        } else if (this.direction === 'right') {
            this.sprite.setFlipX(false);
        }
    }
    
    /**
     * 무기 위치를 업데이트합니다
     */
    updateWeaponPosition() {
        if (!this.weapon || !this.weapon.visible) return;
        
        const offsetX = this.direction === 'left' ? -8 : 8;
        const offsetY = -5;
        
        this.weapon.setPosition(
            this.sprite.x + offsetX,
            this.sprite.y + offsetY
        );
        
        // 방향에 따른 무기 각도 조정
        let angle = 0;
        switch(this.direction) {
            case 'left': angle = -45; break;
            case 'right': angle = 45; break;
            case 'up': angle = -90; break;
            case 'down': angle = 90; break;
        }
        this.weapon.setRotation(Phaser.Math.DegToRad(angle));
    }
    
    /**
     * 이동 상태를 설정합니다
     * @param {boolean} moving - 이동 중 여부
     */
    setMoving(moving) {
        this.isMoving = moving;
        if (moving && this.state !== PLAYER_STATES.ATTACKING) {
            this.state = PLAYER_STATES.MOVING;
        } else if (!moving && this.state !== PLAYER_STATES.ATTACKING) {
            this.state = PLAYER_STATES.IDLE;
        }
    }
    
    /**
     * 플레이어 방향을 설정합니다
     * @param {string} direction - 방향 ('up', 'down', 'left', 'right')
     */
    setDirection(direction) {
        this.lastDirection = this.direction;
        this.direction = direction;
    }
    
    /**
     * 서버에서 받은 위치로 목표 설정 (원격 플레이어용)
     * @param {number} x - 목표 X 위치
     * @param {number} y - 목표 Y 위치
     */
    setTargetPosition(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    /**
     * 위치를 즉시 설정합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     */
    setPosition(x, y) {
        this.sprite.setPosition(x, y);
        this.targetX = x;
        this.targetY = y;
    }
    
    /**
     * 공격을 수행합니다
     * @param {number} targetX - 공격 목표 X
     * @param {number} targetY - 공격 목표 Y
     */
    performAttack(targetX, targetY) {
        if (this.attackCooldown > 0) return false;
        
        // 공격 쿨다운 설정 (하지만 이동은 막지 않음)
        this.attackCooldown = 500; // 0.5초 쿨다운
        
        // 공격 방향 계산
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y, targetX, targetY
        );
        
        // 방향 설정
        if (angle > -Math.PI/4 && angle < Math.PI/4) {
            this.setDirection('right');
        } else if (angle > Math.PI/4 && angle < 3*Math.PI/4) {
            this.setDirection('down');
        } else if (angle > -3*Math.PI/4 && angle < -Math.PI/4) {
            this.setDirection('up');
        } else {
            this.setDirection('left');
        }
        
        // 잠깐 공격 상태로 설정 (이동은 계속 가능)
        const prevState = this.state;
        this.state = PLAYER_STATES.ATTACKING;
        
        // 무기 표시 및 공격 애니메이션
        this.weapon.setVisible(true);
        
        // 공격 애니메이션 트윈
        this.scene.tweens.add({
            targets: this.weapon,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.weapon.setVisible(false);
                // 공격 상태가 아닌 이전 상태로 복원
                if (this.state === PLAYER_STATES.ATTACKING) {
                    this.state = this.isMoving ? PLAYER_STATES.MOVING : PLAYER_STATES.IDLE;
                }
            }
        });
        
        return true;
    }
    
    /**
     * 데미지를 받습니다
     * @param {number} damage - 받을 데미지
     */
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        
        // 데미지 효과
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2
        });
        
        // 사망 처리
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * 플레이어가 사망합니다
     */
    die() {
        this.state = PLAYER_STATES.DEAD;
        this.sprite.setTint(0x666666); // 회색으로 변경
        this.sprite.setVelocity(0, 0);
        
        // 사망 애니메이션
        this.scene.tweens.add({
            targets: [this.sprite, this.nameText, this.healthBarBg, this.healthBar],
            alpha: 0.3,
            duration: 1000
        });
    }
    
    /**
     * 플레이어를 부활시킵니다
     * @param {number} x - 부활 위치 X
     * @param {number} y - 부활 위치 Y
     */
    respawn(x, y) {
        this.health = this.maxHealth;
        this.state = PLAYER_STATES.IDLE;
        this.setPosition(x, y);
        this.sprite.clearTint();
        
        // 투명도 복원
        this.scene.tweens.add({
            targets: [this.sprite, this.nameText, this.healthBarBg, this.healthBar],
            alpha: 1,
            duration: 500
        });
    }
    
    /**
     * 플레이어를 파괴합니다
     */
    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.nameText) this.nameText.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.weapon) this.weapon.destroy();
        
        console.log(`👤 Player ${this.playerId} destroyed`);
    }
    
    /**
     * 현재 위치를 반환합니다
     * @returns {Object} {x, y} 위치 객체
     */
    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }
    
    /**
     * 플레이어가 살아있는지 확인합니다
     * @returns {boolean} 생존 여부
     */
    isAlive() {
        return this.health > 0;
    }
}

/**
 * 입력 관리 클래스 (로컬 플레이어용)
 */
class InputManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // 키보드 입력 설정
        this.keys = {
            W: scene.input.keyboard.addKey(KEYS.W),
            A: scene.input.keyboard.addKey(KEYS.A),
            S: scene.input.keyboard.addKey(KEYS.S),
            D: scene.input.keyboard.addKey(KEYS.D),
            SPACE: scene.input.keyboard.addKey(KEYS.SPACE)
        };
        
        // 마우스 입력 설정
        scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.handleMouseClick(pointer.worldX, pointer.worldY);
            }
        });
        
        // 입력 상태
        this.movement = { x: 0, y: 0 };
        this.lastInputSent = 0;
        this.inputSendRate = 1000 / 60; // 60fps
        this.lastMovement = { x: 0, y: 0 }; // 이전 이동 상태 저장
    }
    
    /**
     * 입력을 업데이트합니다
     * @param {number} deltaTime - 프레임 시간
     */
    update(deltaTime) {
        this.updateMovementInput();
        this.updateSpecialInputs();
        
        // 네트워크로 입력 전송 (제한된 주기로)
        const now = Date.now();
        if (now - this.lastInputSent > this.inputSendRate) {
            this.sendInputToNetwork();
            this.lastInputSent = now;
        }
        
        // 로컬 즉시 적용
        this.applyMovementLocally(deltaTime);
    }
    
    /**
     * 이동 입력을 업데이트합니다
     */
    updateMovementInput() {
        let x = 0;
        let y = 0;
        
        if (this.keys.A.isDown) x -= 1;
        if (this.keys.D.isDown) x += 1;
        if (this.keys.W.isDown) y -= 1;
        if (this.keys.S.isDown) y += 1;
        
        // 대각선 이동 정규화
        if (x !== 0 && y !== 0) {
            x *= 0.707;
            y *= 0.707;
        }
        
        this.movement = { x, y };
        
        // 방향 설정 (공격 중이 아닐 때만)
        if (this.player.state !== PLAYER_STATES.ATTACKING && (x !== 0 || y !== 0)) {
            if (Math.abs(x) > Math.abs(y)) {
                this.player.setDirection(x > 0 ? 'right' : 'left');
            } else {
                this.player.setDirection(y > 0 ? 'down' : 'up');
            }
            this.player.setMoving(true);
        } else if (x === 0 && y === 0) {
            this.player.setMoving(false);
        }
    }
    
    /**
     * 특수 입력을 업데이트합니다
     */
    updateSpecialInputs() {
        // 스페이스바 특수 능력 (미구현)
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            console.log('💫 Special ability activated (not implemented)');
        }
    }
    
    /**
     * 마우스 클릭을 처리합니다 (공격)
     * @param {number} worldX - 월드 X 좌표
     * @param {number} worldY - 월드 Y 좌표
     */
    handleMouseClick(worldX, worldY) {
        if (this.player.performAttack(worldX, worldY)) {
            // 네트워크로 공격 전송
            if (networkManager) {
                networkManager.sendAttack({
                    targetX: worldX,
                    targetY: worldY,
                    playerId: this.player.playerId
                });
            }
        }
    }
    
    /**
     * 입력을 네트워크로 전송합니다
     */
    sendInputToNetwork() {
        // 이동 상태가 변경되었거나 현재 이동 중일 때 전송
        const movementChanged = this.movement.x !== this.lastMovement.x || this.movement.y !== this.lastMovement.y;
        const isMoving = this.movement.x !== 0 || this.movement.y !== 0;
        
        if (networkManager && (movementChanged || isMoving)) {
            networkManager.sendPlayerInput({
                movement: this.movement,
                direction: this.player.direction,
                playerId: this.player.playerId,
                isMoving: isMoving,
                timestamp: Date.now()
            });
            
            // 이전 이동 상태 저장
            this.lastMovement = { x: this.movement.x, y: this.movement.y };
        }
    }
    
    /**
     * 이동을 로컬에서 즉시 적용합니다
     * @param {number} deltaTime - 프레임 시간
     */
    applyMovementLocally(deltaTime) {
        // 사망 상태에서는 이동 불가
        if (this.player.state === PLAYER_STATES.DEAD) {
            this.player.sprite.setVelocity(0, 0);
            return;
        }
        
        // 이동 입력 적용 (공격 중에도 이동 가능)
        if (this.movement.x !== 0 || this.movement.y !== 0) {
            const speed = GAME_CONFIG.PLAYER.SPEED;
            this.player.sprite.setVelocity(
                this.movement.x * speed,
                this.movement.y * speed
            );
        } else {
            this.player.sprite.setVelocity(0, 0);
        }
    }
}

console.log('👤 Medieval.io Player Class Loaded');
