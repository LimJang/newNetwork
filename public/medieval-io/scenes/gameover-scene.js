/**
 * Medieval.io GameOver Scene
 * 게임 결과와 순위를 표시하는 씬입니다.
 */

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
        this.gameResult = null;
    }
    
    /**
     * 씬 초기화 (다른 씬에서 데이터 전달받음)
     * @param {Object} data - 게임 결과 데이터
     */
    init(data) {
        this.gameResult = data || {
            winner: null,
            rankings: [],
            totalPlayers: 0,
            gameDuration: 0
        };
        console.log('🏆 GameOverScene initialized with data:', this.gameResult);
    }
    
    /**
     * 씬 생성 시 호출됩니다
     */
    create() {
        console.log('🏆 GameOverScene created');
        
        // 배경 설정
        this.cameras.main.setBackgroundColor(0x1a1a2e);
        
        // 페이드 인 효과
        this.cameras.main.fadeIn(1000, 26, 26, 46);
        
        // UI 생성
        this.createGameOverUI();
        
        // 배경 효과
        this.createBackgroundEffects();
        
        // 입력 이벤트 설정
        this.setupInputEvents();
        
        // 자동 메뉴 복귀 타이머 (30초)
        this.autoReturnTimer = this.time.delayedCall(30000, () => {
            this.returnToMenu();
        });
    }
    
    /**
     * 게임 오버 UI를 생성합니다
     */
    createGameOverUI() {
        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;
        
        // 메인 제목
        this.createMainTitle(centerX, centerY - 250);
        
        // 승리자 표시
        this.createWinnerDisplay(centerX, centerY - 150);
        
        // 순위표
        this.createRankingsTable(centerX, centerY - 50);
        
        // 게임 통계
        this.createGameStats(centerX, centerY + 150);
        
        // 액션 버튼들
        this.createActionButtons(centerX, centerY + 250);
    }
    
    /**
     * 메인 제목을 생성합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     */
    createMainTitle(x, y) {
        const titleText = this.add.text(x, y, 'BATTLE CONCLUDED', {
            fontSize: '64px',
            fontFamily: 'Cinzel',
            fill: '#d4af37',
            stroke: '#8b4513',
            strokeThickness: 4,
            fontWeight: 'bold'
        });
        titleText.setOrigin(0.5);
        
        // 제목 애니메이션
        titleText.setScale(0);
        this.tweens.add({
            targets: titleText,
            scale: 1,
            duration: 1000,
            ease: 'Back.easeOut',
            delay: 500
        });
    }
    
    /**
     * 승리자 표시를 생성합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     */
    createWinnerDisplay(x, y) {
        let winnerText = '';
        let winnerColor = '#32cd32';
        
        if (this.gameResult.winner) {
            if (this.gameResult.winner === networkManager.playerId) {
                winnerText = '🏆 VICTORY! 🏆';
                winnerColor = '#ffd700';
                
                // 승리 축하 효과
                this.createVictoryEffects();
            } else {
                winnerText = `🏆 Knight ${this.getPlayerIndex(this.gameResult.winner)} Wins! 🏆`;
                winnerColor = '#32cd32';
            }
        } else {
            winnerText = '⚔️ Draw - No Survivors ⚔️';
            winnerColor = '#ff6347';
        }
        
        const winner = this.add.text(x, y, winnerText, {
            fontSize: '36px',
            fontFamily: 'Cinzel',
            fill: winnerColor,
            stroke: '#000000',
            strokeThickness: 3,
            fontWeight: 'bold'
        });
        winner.setOrigin(0.5);
        
        // 승리자 텍스트 애니메이션
        winner.setAlpha(0);
        this.tweens.add({
            targets: winner,
            alpha: 1,
            duration: 1000,
            delay: 1000
        });
        
        // 반짝이는 효과
        this.tweens.add({
            targets: winner,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 1500
        });
    }
    
    /**
     * 순위표를 생성합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     */
    createRankingsTable(x, y) {
        // 순위표 제목
        const rankingsTitle = this.add.text(x, y, 'FINAL RANKINGS', {
            fontSize: '24px',
            fontFamily: 'Cinzel',
            fill: '#d4af37',
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        });
        rankingsTitle.setOrigin(0.5);
        
        // 순위 목록 생성
        const rankings = this.gameResult.rankings || [];
        rankings.forEach((rankData, index) => {
            this.createRankingEntry(x, y + 40 + (index * 30), index + 1, rankData);
        });
        
        // 순위표가 비어있는 경우
        if (rankings.length === 0) {
            this.add.text(x, y + 60, 'No ranking data available', {
                fontSize: '18px',
                fontFamily: 'Cinzel',
                fill: '#999999',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5);
        }
    }
    
    /**
     * 개별 순위 항목을 생성합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     * @param {number} rank - 순위
     * @param {Object} rankData - 순위 데이터
     */
    createRankingEntry(x, y, rank, rankData) {
        const isLocalPlayer = rankData.playerId === networkManager.playerId;
        
        // 순위에 따른 색상 설정
        let rankColor = '#ffffff';
        let medalEmoji = '';
        
        switch(rank) {
            case 1:
                rankColor = '#ffd700';
                medalEmoji = '🥇';
                break;
            case 2:
                rankColor = '#c0c0c0';
                medalEmoji = '🥈';
                break;
            case 3:
                rankColor = '#cd7f32';
                medalEmoji = '🥉';
                break;
            default:
                rankColor = isLocalPlayer ? '#90ee90' : '#ffffff';
                break;
        }
        
        // 순위 텍스트
        const rankText = `${medalEmoji} #${rank} Knight ${this.getPlayerIndex(rankData.playerId)}`;
        
        const rankEntry = this.add.text(x, y, rankText, {
            fontSize: '18px',
            fontFamily: 'Cinzel',
            fill: rankColor,
            stroke: '#000000',
            strokeThickness: 1,
            fontWeight: isLocalPlayer ? 'bold' : 'normal'
        });
        rankEntry.setOrigin(0.5);
        
        // 로컬 플레이어 하이라이트
        if (isLocalPlayer) {
            const highlight = this.add.rectangle(x, y, rankEntry.width + 20, 25, 0x32cd32, 0.2);
            highlight.setStrokeStyle(2, 0x32cd32);
        }
        
        // 애니메이션 (순차적으로 나타남)
        rankEntry.setAlpha(0);
        this.tweens.add({
            targets: rankEntry,
            alpha: 1,
            duration: 500,
            delay: 1500 + (rank * 200)
        });
    }
    
    /**
     * 게임 통계를 생성합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     */
    createGameStats(x, y) {
        const stats = [
            `Total Knights: ${this.gameResult.totalPlayers || 0}`,
            `Battle Duration: ${this.formatDuration(this.gameResult.gameDuration || 0)}`,
            `Your Ping: ${networkManager.getPing()}ms`
        ];
        
        stats.forEach((stat, index) => {
            const statText = this.add.text(x, y + (index * 25), stat, {
                fontSize: '16px',
                fontFamily: 'Cinzel',
                fill: '#b8860b',
                stroke: '#000000',
                strokeThickness: 1
            });
            statText.setOrigin(0.5);
            
            // 애니메이션
            statText.setAlpha(0);
            this.tweens.add({
                targets: statText,
                alpha: 1,
                duration: 500,
                delay: 2500 + (index * 200)
            });
        });
    }
    
    /**
     * 액션 버튼들을 생성합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     */
    createActionButtons(x, y) {
        // 다시 플레이 버튼
        this.playAgainButton = this.add.text(x - 120, y, 'PLAY AGAIN', {
            fontSize: '24px',
            fontFamily: 'Cinzel',
            fill: '#32cd32',
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        });
        this.playAgainButton.setOrigin(0.5);
        this.playAgainButton.setInteractive({ useHandCursor: true });
        this.playAgainButton.on('pointerdown', () => this.playAgain());
        this.playAgainButton.on('pointerover', () => {
            this.playAgainButton.setFill('#90ee90');
            this.playAgainButton.setScale(1.1);
        });
        this.playAgainButton.on('pointerout', () => {
            this.playAgainButton.setFill('#32cd32');
            this.playAgainButton.setScale(1.0);
        });
        
        // 메뉴로 돌아가기 버튼
        this.menuButton = this.add.text(x + 120, y, 'MAIN MENU', {
            fontSize: '24px',
            fontFamily: 'Cinzel',
            fill: '#d4af37',
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        });
        this.menuButton.setOrigin(0.5);
        this.menuButton.setInteractive({ useHandCursor: true });
        this.menuButton.on('pointerdown', () => this.returnToMenu());
        this.menuButton.on('pointerover', () => {
            this.menuButton.setFill('#ffd700');
            this.menuButton.setScale(1.1);
        });
        this.menuButton.on('pointerout', () => {
            this.menuButton.setFill('#d4af37');
            this.menuButton.setScale(1.0);
        });
        
        // 버튼 애니메이션
        [this.playAgainButton, this.menuButton].forEach((button, index) => {
            button.setAlpha(0);
            this.tweens.add({
                targets: button,
                alpha: 1,
                duration: 500,
                delay: 3000 + (index * 200)
            });
        });
        
        // 자동 복귀 안내
        this.autoReturnText = this.add.text(x, y + 60, 'Automatically returning to menu in 30 seconds...', {
            fontSize: '14px',
            fontFamily: 'Cinzel',
            fill: '#999999',
            stroke: '#000000',
            strokeThickness: 1
        });
        this.autoReturnText.setOrigin(0.5);
        this.autoReturnText.setAlpha(0);
        
        this.tweens.add({
            targets: this.autoReturnText,
            alpha: 1,
            duration: 500,
            delay: 4000
        });
    }
    
    /**
     * 승리 축하 효과를 생성합니다
     */
    createVictoryEffects() {
        // 황금 파티클 효과
        const particles = this.add.particles(GAME_CONFIG.WIDTH / 2, 0, 'sword', {
            scale: { start: 0.5, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 3000,
            quantity: 2,
            tint: 0xffd700,
            emitZone: { 
                type: 'edge', 
                source: new Phaser.Geom.Rectangle(0, 0, GAME_CONFIG.WIDTH, 10),
                quantity: 50
            }
        });
        
        // 화면 플래시 효과
        this.cameras.main.flash(1000, 255, 215, 0, false);
        
        // 3초 후 파티클 제거
        this.time.delayedCall(3000, () => {
            particles.destroy();
        });
    }
    
    /**
     * 배경 효과를 생성합니다
     */
    createBackgroundEffects() {
        // 떠다니는 별들
        for (let i = 0; i < 20; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, GAME_CONFIG.WIDTH),
                Phaser.Math.Between(0, GAME_CONFIG.HEIGHT),
                Phaser.Math.Between(1, 3),
                0xffffff,
                Phaser.Math.FloatBetween(0.3, 0.8)
            );
            
            // 반짝이는 애니메이션
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }
    
    /**
     * 입력 이벤트를 설정합니다
     */
    setupInputEvents() {
        // ESC 키로 메뉴 복귀
        this.input.keyboard.on('keydown-ESC', () => {
            this.returnToMenu();
        });
        
        // 스페이스바로 다시 플레이
        this.input.keyboard.on('keydown-SPACE', () => {
            this.playAgain();
        });
    }
    
    /**
     * 다시 플레이를 시작합니다
     */
    playAgain() {
        console.log('🔄 Starting new game...');
        
        // 타이머 취소
        if (this.autoReturnTimer) {
            this.autoReturnTimer.destroy();
        }
        
        // 게임 씬으로 직접 전환
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
        });
    }
    
    /**
     * 메인 메뉴로 돌아갑니다
     */
    returnToMenu() {
        console.log('🏠 Returning to main menu...');
        
        // 타이머 취소
        if (this.autoReturnTimer) {
            this.autoReturnTimer.destroy();
        }
        
        // 네트워크 연결 해제 후 메뉴로
        networkManager.disconnect();
        
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }
    
    /**
     * 플레이어 인덱스를 반환합니다
     * @param {string} playerId - 플레이어 ID
     * @returns {number} 플레이어 인덱스
     */
    getPlayerIndex(playerId) {
        return parseInt(playerId.slice(-3)) % 8;
    }
    
    /**
     * 시간을 포맷합니다
     * @param {number} milliseconds - 밀리초
     * @returns {string} 포맷된 시간 문자열
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    }
    
    /**
     * 씬 업데이트 (매 프레임 호출)
     * @param {number} time - 게임 시간
     * @param {number} delta - 프레임 델타
     */
    update(time, delta) {
        // 게임 오버 씬에서는 특별한 업데이트 로직 없음
    }
    
    /**
     * 씬 파괴 시 호출
     */
    destroy() {
        if (this.autoReturnTimer) {
            this.autoReturnTimer.destroy();
        }
    }
}

console.log('🏆 Medieval.io GameOver Scene Loaded');