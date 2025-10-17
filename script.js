class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverElement = document.getElementById('gameOver');
        this.startScreenElement = document.getElementById('startScreen');

        // 速度控制元素
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');

        // 游戏设置
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;

        // 游戏状态
        this.snake = [];
        this.direction = { x: 0, y: 0 };
        this.food = {};
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gameSpeed = 100;
        this.speedLevel = 5;
        this.gameLoopTimeout = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateHighScore();
        this.updateGameSpeed();
        this.updateSpeedButtons(this.speedLevel);
        this.showStartScreen();
    }

    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 按钮控制
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                this.changeDirection(direction);
            });
        });

        // 开始游戏按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startGame();
        });

        // 速度滑块控制
        this.speedSlider.addEventListener('input', (e) => {
            this.handleSpeedChange(e.target.value);
        });

        // 速度按钮控制
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.dataset.speed);
                this.setSpeed(speed);
                this.updateSpeedButtons(speed);
            });
        });
    }

    showStartScreen() {
        this.startScreenElement.classList.add('show');
        this.gameOverElement.classList.remove('show');
    }

    startGame() {
        this.hideAllScreens();
        this.resetGame();
        this.gameRunning = true;
        this.gameLoop();
    }

    hideAllScreens() {
        this.startScreenElement.classList.remove('show');
        this.gameOverElement.classList.remove('show');
    }

    resetGame() {
        // 停止当前游戏循环
        this.gameRunning = false;
        if (this.gameLoopTimeout) {
            clearTimeout(this.gameLoopTimeout);
            this.gameLoopTimeout = null;
        }

        // 初始化蛇
        this.snake = [
            { x: 10, y: 10 }
        ];

        // 设置初始方向
        this.direction = { x: 0, y: 0 };

        // 重置分数
        this.score = 0;
        this.updateScore();

        // 根据速度等级设置游戏速度
        this.updateGameSpeed();

        // 生成食物
        this.generateFood();
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.draw();

        this.gameLoopTimeout = setTimeout(() => this.gameLoop(), this.gameSpeed);
    }

    update() {
        // 如果蛇还没有开始移动，不进行更新
        if (this.direction.x === 0 && this.direction.y === 0) {
            return;
        }

        // 移动蛇头
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.tileCount ||
            head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // 检查自身碰撞
        if (this.checkSelfCollision(head)) {
            this.gameOver();
            return;
        }

        // 添加新头部
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            // 如果没有吃到食物，移除尾部
            this.snake.pop();
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.drawGrid();

        // 绘制蛇
        this.drawSnake();

        // 绘制食物
        this.drawFood();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 0.5;

        for (let i = 0; i <= this.tileCount; i++) {
            const pos = i * this.gridSize;

            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();

            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头 - 更亮的颜色
                this.ctx.fillStyle = '#48bb78';
            } else {
                // 蛇身 - 渐变颜色
                const gradient = index / this.snake.length;
                this.ctx.fillStyle = `rgba(72, 187, 120, ${1 - gradient * 0.5})`;
            }

            this.ctx.fillRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4
            );

            // 添加边框
            this.ctx.strokeStyle = '#2f855a';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4
            );
        });
    }

    drawFood() {
        // 食物 - 红色圆形
        this.ctx.fillStyle = '#f56565';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // 添加光晕效果
        this.ctx.strokeStyle = '#fc8181';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    handleKeyPress(e) {
        if (!this.gameRunning) return;

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.changeDirection('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.changeDirection('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.changeDirection('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.changeDirection('right');
                break;
        }
    }

    changeDirection(newDirection) {
        if (!this.gameRunning) return;

        const directions = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };

        const newDir = directions[newDirection];

        // 防止反向移动
        if (this.snake.length > 1) {
            if (newDir.x === -this.direction.x && newDir.y === -this.direction.y) {
                return;
            }
        }

        this.direction = newDir;
    }

    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.checkFoodOnSnake());
    }

    checkFoodOnSnake() {
        return this.snake.some(segment =>
            segment.x === this.food.x && segment.y === this.food.y
        );
    }

    checkSelfCollision(head) {
        return this.snake.some(segment =>
            segment.x === head.x && segment.y === head.y
        );
    }

    eatFood() {
        this.score += 10;
        this.updateScore();
        this.generateFood();
    }

    updateScore() {
        this.scoreElement.textContent = this.score;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScore();
        }
    }

    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
        localStorage.setItem('snakeHighScore', this.highScore);
    }

    gameOver() {
        this.gameRunning = false;
        if (this.gameLoopTimeout) {
            clearTimeout(this.gameLoopTimeout);
            this.gameLoopTimeout = null;
        }
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.add('show');
    }

    // 速度控制方法
    handleSpeedChange(value) {
        this.speedLevel = parseInt(value);
        this.speedValue.textContent = this.speedLevel;
        this.updateGameSpeed();
        this.updateSpeedButtons(this.speedLevel);
    }

    setSpeed(speed) {
        this.speedLevel = speed;
        this.speedSlider.value = speed;
        this.speedValue.textContent = speed;
        this.updateGameSpeed();
    }

    updateGameSpeed() {
        // 速度等级 1-10 对应的游戏延迟（毫秒）
        // 等级越高，延迟越少，速度越快
        const speedMap = {
            1: 250,  // 最慢
            2: 220,
            3: 190,
            4: 160,
            5: 130,  // 中等
            6: 110,
            7: 90,
            8: 70,
            9: 50,
            10: 30   // 最快
        };

        this.gameSpeed = speedMap[this.speedLevel] || 130;
    }

    updateSpeedButtons(activeSpeed) {
        document.querySelectorAll('.speed-btn').forEach(btn => {
            const speed = parseInt(btn.dataset.speed);
            if (speed === activeSpeed) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});