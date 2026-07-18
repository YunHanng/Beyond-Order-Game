// ========== 游戏常量 ==========
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.6;
const JUMP_POWER = 12;
const MOVE_SPEED = 5;
const LEVEL_WIDTH = 2400; // 关卡宽度（可滚动）

// ========== 游戏状态 ==========
const gameState = {
    anomalyValue: 0,
    cameraX: 0,
    dialogActive: false,
    hiddenStairsDiscovered: false,
    npcInteracted: false,
    gameStarted: false,
};

// ========== 主角 - 李寒 ==========
const player = {
    x: 100,
    y: 400,
    width: 30,
    height: 50,
    velocityY: 0,
    velocityX: 0,
    isJumping: false,
    direction: 1, // 1右 -1左
    
    update() {
        // 应用重力
        if (this.y + this.height < 550) {
            this.velocityY += GRAVITY;
        } else {
            this.velocityY = 0;
            this.y = 550 - this.height;
            this.isJumping = false;
        }
        
        // 水平移动
        this.x += this.velocityX;
        
        // 处理地图边界
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > LEVEL_WIDTH) this.x = LEVEL_WIDTH - this.width;
        
        // 更新Y位置
        this.y += this.velocityY;
        
        // 地板碰撞检测
        this.checkPlatformCollisions();
        
        // 更新摄像头跟随
        updateCamera();
    },
    
    jump() {
        if (!this.isJumping) {
            this.velocityY = -JUMP_POWER;
            this.isJumping = true;
        }
    },
    
    moveLeft() {
        this.velocityX = -MOVE_SPEED;
        this.direction = -1;
    },
    
    moveRight() {
        this.velocityX = MOVE_SPEED;
        this.direction = 1;
    },
    
    stop() {
        this.velocityX = 0;
    },
    
    checkPlatformCollisions() {
        const platforms = level.platforms;
        
        for (let platform of platforms) {
            // 检查是否在平台上方落下
            if (this.velocityY >= 0 &&
                this.y + this.height <= platform.y + 10 &&
                this.y + this.height + this.velocityY >= platform.y &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width) {
                
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }
    },
    
    draw(ctx) {
        const screenX = this.x - gameState.cameraX;
        
        // 身体（蓝色）
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(screenX, this.y, this.width, this.height);
        
        // 头部（黄色）
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX + 5, this.y - 12, 20, 15);
        
        // 眼睛
        ctx.fillStyle = '#000';
        const eyeY = this.y - 8;
        ctx.fillRect(screenX + 9, eyeY, 3, 3);
        ctx.fillRect(screenX + 18, eyeY, 3, 3);
        
        // 腿部
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(screenX + 5, this.y + this.height, 8, 10);
        ctx.fillRect(screenX + 17, this.y + this.height, 8, 10);
    }
};

// ========== NPC - 陈玉莹 ==========
const npcChenYuying = {
    x: 800,
    y: 400,
    width: 30,
    height: 50,
    
    draw(ctx) {
        const screenX = this.x - gameState.cameraX;
        
        // 身体（紫红色）
        ctx.fillStyle = '#E91E63';
        ctx.fillRect(screenX, this.y, this.width, this.height);
        
        // 头部（粉色）
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(screenX + 5, this.y - 12, 20, 15);
        
        // 眼睛（眨眼）
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 9, this.y - 8, 3, 3);
        ctx.fillRect(screenX + 18, this.y - 8, 3, 3);
        
        // 名牌标识
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px Arial';
        const screenX2 = screenX;
        ctx.fillText('陈玉莹', screenX2 - 5, this.y - 20);
    },
    
    checkInteraction(player) {
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        return distance < 100;
    }
};

// ========== 关卡数据 ==========
const level = {
    name: '明光界校园',
    width: LEVEL_WIDTH,
    height: CANVAS_HEIGHT,
    
    platforms: [
        // 地面
        { x: 0, y: 550, width: 2400, height: 50 },
        // 第一阶梯
        { x: 300, y: 480, width: 150, height: 20 },
        // 第二阶梯
        { x: 500, y: 420, width: 150, height: 20 },
        // 校园建筑平台
        { x: 750, y: 400, width: 200, height: 20 },
        // 高台
        { x: 1050, y: 350, width: 180, height: 20 },
        // 中间浮台
        { x: 1300, y: 380, width: 150, height: 20 },
        // 右侧高台
        { x: 1600, y: 300, width: 200, height: 20 },
        // 秘密平台（隐藏楼梯）
        { x: 1850, y: 450, width: 120, height: 20, hidden: true }
    ],
    
    obstacles: [
        { x: 600, y: 480, width: 40, height: 40 },
        { x: 1200, y: 420, width: 50, height: 50 },
    ],
    
    npcs: [npcChenYuying]
};

// ========== 对话系统 ==========
const dialogues = {
    first_meeting: {
        speaker: '陈玉莹',
        text: '你就是李寒吧？欢迎来到明光界校园。这个地方充满了秩序与异常的边界...',
    },
    hidden_stair: {
        speaker: '陈玉莹',
        text: '哇！你发现了隐藏的楼梯！这说明你的异常值在上升。小心不要走得太远...',
    },
    anomaly_increase: {
        speaker: '系统提示',
        text: '异常值 +10',
    }
};

// ========== 输入处理 ==========
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        player.jump();
    }
    
    if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleInteraction();
    }
    
    if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        discoverHiddenStairs();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ========== 游戏逻辑 ==========
function handleInteraction() {
    if (gameState.dialogActive) {
        gameState.dialogActive = false;
        hideDialog();
        return;
    }
    
    if (npcChenYuying.checkInteraction(player)) {
        if (!gameState.npcInteracted) {
            gameState.npcInteracted = true;
            gameState.anomalyValue += 10;
            showDialog(dialogues.first_meeting);
        }
    }
}

function discoverHiddenStairs() {
    if (gameState.hiddenStairsDiscovered) return;
    
    const hiddenStair = level.platforms.find(p => p.hidden);
    if (hiddenStair && 
        Math.hypot(player.x - (hiddenStair.x + hiddenStair.width / 2), 
                   player.y - hiddenStair.y) < 150) {
        
        gameState.hiddenStairsDiscovered = true;
        gameState.anomalyValue += 20;
        showDialog(dialogues.hidden_stair);
    }
}

function showDialog(dialogData) {
    const dialogBox = document.getElementById('dialog-box');
    const speaker = document.getElementById('dialog-speaker');
    const text = document.getElementById('dialog-text');
    
    speaker.textContent = dialogData.speaker;
    text.textContent = dialogData.text;
    dialogBox.style.display = 'block';
    gameState.dialogActive = true;
}

function hideDialog() {
    const dialogBox = document.getElementById('dialog-box');
    dialogBox.style.display = 'none';
}

function updateCamera() {
    // 摄像头跟随主角，保持在屏幕中央
    const targetCameraX = player.x - CANVAS_WIDTH / 3;
    gameState.cameraX = Math.max(0, Math.min(targetCameraX, level.width - CANVAS_WIDTH));
}

function updateAnomalyDisplay() {
    document.getElementById('anomaly-value').textContent = gameState.anomalyValue;
}

// ========== 绘制函数 ==========
function draw(ctx) {
    // 背景 - 校园场景
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 远景山丘
    ctx.fillStyle = 'rgba(100, 150, 80, 0.3)';
    ctx.beginPath();
    ctx.ellipse(CANVAS_WIDTH / 2 - gameState.cameraX * 0.5, 150, 300, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(100, 150, 80, 0.2)';
    ctx.beginPath();
    ctx.ellipse(CANVAS_WIDTH - gameState.cameraX * 0.5, 180, 250, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制平台
    ctx.fillStyle = '#8B4513';
    for (let platform of level.platforms) {
        const screenX = platform.x - gameState.cameraX;
        
        // 绘制隐藏平台时的特殊效果
        if (platform.hidden && !gameState.hiddenStairsDiscovered) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#FFB6C1';
        } else {
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#8B4513';
        }
        
        ctx.fillRect(screenX, platform.y, platform.width, platform.height);
        
        // 平台边框
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, platform.y, platform.width, platform.height);
    }
    ctx.globalAlpha = 1;
    
    // 绘制障碍物
    ctx.fillStyle = '#DC143C';
    for (let obstacle of level.obstacles) {
        const screenX = obstacle.x - gameState.cameraX;
        ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, obstacle.y, obstacle.width, obstacle.height);
    }
    
    // 绘制NPC
    for (let npc of level.npcs) {
        npc.draw(ctx);
        
        // 绘制交互范围指示
        if (npc.checkInteraction(player)) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 2;
            const screenX = npc.x - gameState.cameraX;
            ctx.beginPath();
            ctx.arc(screenX + npc.width / 2, npc.y - 30, 60, 0, Math.PI * 2);
            ctx.stroke();
            
            // 交互提示
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('按[E]交互', screenX + npc.width / 2, npc.y - 50);
        }
    }
    
    // 绘制主角
    player.draw(ctx);
    
    // 绘制异常值指示器（屏幕角落）
    if (gameState.anomalyValue > 0) {
        ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 3);
        const progressWidth = (gameState.anomalyValue / 100) * CANVAS_WIDTH;
        ctx.fillStyle = '#E94560';
        ctx.fillRect(0, 0, progressWidth, 3);
    }
}

// ========== 主游戏循环 ==========
function gameLoop() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 处理输入
    if (keys['arrowleft'] || keys['a']) {
        player.moveLeft();
    } else if (keys['arrowright'] || keys['d']) {
        player.moveRight();
    } else {
        player.stop();
    }
    
    // 更新游戏状态
    player.update();
    
    // 绘制
    draw(ctx);
    updateAnomalyDisplay();
    
    requestAnimationFrame(gameLoop);
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    console.log('游戏初始化完成');
    console.log('游戏规模: ' + CANVAS_WIDTH + 'x' + CANVAS_HEIGHT);
    console.log('关卡: ' + level.name);
    
    gameLoop();
    
    // 显示欢迎信息
    setTimeout(() => {
        showDialog({
            speaker: '系统',
            text: '欢迎来到《秩序之外：异常者》Demo！使用方向键移动，空格跳跃，E键交互。探索校园，发现隐藏秘密！'
        });
    }, 500);
});
