/**
 * ============================================================
 *  月亮棋 Moon Chess — 游戏引擎 + AI + UI 控制器
 * ============================================================
 *
 *  核心规则：
 *  - 3×3 棋盘，白棋先手
 *  - 每方最多 3 枚棋子，第 4 子触发 FIFO 淘汰
 *  - 落子后先检测胜利，再淘汰；获胜优先于淘汰
 *  - 100 回合无胜负 → 平局
 */

// ============================================================
// 一、纯游戏逻辑引擎
// ============================================================

class MoonChessEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = Array(9).fill(null);          // 棋盘状态
        this.whiteQueue = [];                      // 白棋 FIFO 队列
        this.blueQueue = [];                       // 蓝棋 FIFO 队列
        this.currentPlayer = 'white';              // 当前玩家
        this.moveCount = 0;                        // 回合数
        this.status = 'playing';                   // playing | white_win | blue_win | draw
        this.winner = null;                        // 获胜方
        this.winningCells = [];                    // 获胜三连格子
        this.lastEliminated = null;                // 本回合被淘汰的棋子位置
        this.history = [];                         // 回合历史（用于悔棋）
    }

    /**
     * 在指定位置落子
     * @returns {object} { success, eliminated, winner, winningCells, message }
     */
    placePiece(pos) {
        if (this.status !== 'playing') return { success: false, message: '游戏已结束' };
        if (this.board[pos] !== null) return { success: false, message: '位置已有棋子' };

        const player = this.currentPlayer;
        const queue = player === 'white' ? this.whiteQueue : this.blueQueue;

        // 保存历史
        this.history.push({
            board: [...this.board],
            whiteQueue: [...this.whiteQueue],
            blueQueue: [...this.blueQueue],
            currentPlayer: this.currentPlayer,
            moveCount: this.moveCount,
        });

        // 步骤 1：放置棋子
        this.board[pos] = player;
        queue.push(pos);
        this.moveCount++;

        // 步骤 2：检查胜利（在 FIFO 淘汰之前！）
        const winResult = this._checkWin(player);
        if (winResult) {
            this.status = player === 'white' ? 'white_win' : 'blue_win';
            this.winner = player;
            this.winningCells = winResult;
            return {
                success: true, eliminated: null,
                winner: player, winningCells: winResult,
                message: '获胜！',
            };
        }

        // 步骤 3：FIFO 淘汰
        let eliminated = null;
        if (queue.length > 3) {
            eliminated = queue.shift();
            this.board[eliminated] = null;
        }
        this.lastEliminated = eliminated;

        // 步骤 4：平局判定
        if (this.moveCount >= 100) {
            this.status = 'draw';
            return { success: true, eliminated, winner: null, winningCells: [], message: '平局' };
        }

        // 步骤 5：切换玩家
        this.currentPlayer = player === 'white' ? 'blue' : 'white';

        return { success: true, eliminated, winner: null, winningCells: [], message: '继续' };
    }

    /** 检查指定玩家是否三连 */
    _checkWin(player) {
        const lines = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6],
        ];
        for (const l of lines) {
            if (this.board[l[0]]===player && this.board[l[1]]===player && this.board[l[2]]===player)
                return l;
        }
        return null;
    }

    getAvailableMoves() {
        const m = [];
        for (let i = 0; i < 9; i++) if (this.board[i] === null) m.push(i);
        return m;
    }

    getPieceOrder(player) {
        return player === 'white' ? [...this.whiteQueue] : [...this.blueQueue];
    }

    getPieceAge(player, pos) {
        return (player === 'white' ? this.whiteQueue : this.blueQueue).indexOf(pos);
    }

    clone() {
        const c = new MoonChessEngine();
        c.board = [...this.board];
        c.whiteQueue = [...this.whiteQueue];
        c.blueQueue = [...this.blueQueue];
        c.currentPlayer = this.currentPlayer;
        c.moveCount = this.moveCount;
        c.status = this.status;
        c.winner = this.winner;
        c.winningCells = [...this.winningCells];
        c.lastEliminated = this.lastEliminated;
        c.history = [];
        return c;
    }

    undo() {
        if (this.history.length === 0) return false;
        const prev = this.history.pop();
        this.board = prev.board;
        this.whiteQueue = prev.whiteQueue;
        this.blueQueue = prev.blueQueue;
        this.currentPlayer = prev.currentPlayer;
        this.moveCount = prev.moveCount;
        this.status = 'playing';
        this.winner = null;
        this.winningCells = [];
        this.lastEliminated = null;
        return true;
    }

    /** 悔棋后附赠：恢复 AI 上一手之前（跳两帧） */
    undoAITurn() {
        if (this.history.length < 2) return false;
        this.undo();
        this.undo();
        return true;
    }
}


// ============================================================
// 二、AI 控制器
// ============================================================

class AIController {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
    }

    getMove(game) {
        const state = game.clone();
        switch (this.difficulty) {
            case 'easy': return this._easyMove(state);
            case 'medium': return this._mediumMove(state);
            case 'hard': return this._hardMove(state);
            default: return this._easyMove(state);
        }
    }

    // ---- 简单：随机 + 优先获胜 + 基础防守 ----
    _easyMove(game) {
        const moves = game.getAvailableMoves();
        if (moves.length === 0) return -1;
        const aiPlayer = game.currentPlayer;
        const opponent = aiPlayer === 'white' ? 'blue' : 'white';

        // 自己能赢就赢
        for (const pos of moves) {
            const s = game.clone();
            if (s.placePiece(pos).winner === aiPlayer) return pos;
        }

        // 堵对手
        for (const pos of moves) {
            const s = game.clone();
            s.currentPlayer = opponent;
            if (s.placePiece(pos).winner === opponent) return pos;
        }

        // 优先中心
        if (moves.includes(4)) return 4;

        // 角落
        const corners = moves.filter(p => [0,2,6,8].includes(p));
        if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

        return moves[Math.floor(Math.random() * moves.length)];
    }

    // ---- 普通：策略评分 ----
    _mediumMove(game) {
        const moves = game.getAvailableMoves();
        if (moves.length === 0) return -1;
        const aiPlayer = game.currentPlayer;
        const opponent = aiPlayer === 'white' ? 'blue' : 'white';

        // 获胜优先
        for (const pos of moves) {
            const s = game.clone();
            if (s.placePiece(pos).winner === aiPlayer) return pos;
        }
        // 防守
        for (const pos of moves) {
            const s = game.clone();
            s.currentPlayer = opponent;
            if (s.placePiece(pos).winner === opponent) return pos;
        }

        // 评分
        let bestScore = -Infinity;
        let best = [];
        for (const pos of moves) {
            const s = game.clone();
            s.placePiece(pos);
            const score = this._eval(s, aiPlayer, opponent);
            if (score > bestScore) { bestScore = score; best = [pos]; }
            else if (score === bestScore) best.push(pos);
        }
        return best[Math.floor(Math.random() * best.length)];
    }

    /** 启发式评估（棋子越新价值越高） */
    _eval(game, aiPlayer, opponent) {
        let score = 0;
        const lines = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6],
        ];
        for (const l of lines) {
            let ai = 0, opp = 0, aiAge = 0, oppAge = 0;
            for (const c of l) {
                if (game.board[c] === aiPlayer) { ai++; aiAge += game.getPieceAge(aiPlayer, c); }
                else if (game.board[c] === opponent) { opp++; oppAge += game.getPieceAge(opponent, c); }
            }
            if (opp === 0 && ai > 0) score += Math.pow(10, ai) * ((aiAge / ai + 1) / 3);
            else if (ai === 0 && opp > 0) score -= Math.pow(10, opp) * ((oppAge / opp + 1) / 3);
        }
        // 中心
        if (game.board[4] === aiPlayer) score += 30 * ((game.getPieceAge(aiPlayer, 4) + 1) / 3);
        else if (game.board[4] === opponent) score -= 30 * ((game.getPieceAge(opponent, 4) + 1) / 3);
        // 角落
        for (const c of [0,2,6,8]) {
            if (game.board[c] === aiPlayer) score += 15 * ((game.getPieceAge(aiPlayer, c) + 1) / 3);
            else if (game.board[c] === opponent) score -= 15 * ((game.getPieceAge(opponent, c) + 1) / 3);
        }
        return score;
    }

    // ---- 困难：Minimax + Alpha-Beta 剪枝 ----
    _hardMove(game) {
        const moves = game.getAvailableMoves();
        if (moves.length === 0) return -1;
        const aiPlayer = game.currentPlayer;
        const opponent = aiPlayer === 'white' ? 'blue' : 'white';

        for (const pos of moves) {
            const s = game.clone();
            if (s.placePiece(pos).winner === aiPlayer) return pos;
        }

        const depth = 4;
        let bestScore = -Infinity;
        let best = [];
        const ordered = this._orderMoves(moves, game, aiPlayer, opponent);

        for (const pos of ordered) {
            const s = game.clone();
            s.placePiece(pos);
            if (s.status !== 'playing') {
                if (s.winner === aiPlayer) return pos;
                continue;
            }
            const score = this._minimax(s, depth - 1, -Infinity, Infinity, false, aiPlayer, opponent);
            if (score > bestScore) { bestScore = score; best = [pos]; }
            else if (score === bestScore) best.push(pos);
        }
        return best[Math.floor(Math.random() * best.length)];
    }

    _minimax(game, depth, alpha, beta, isMax, aiPlayer, opponent) {
        if (depth === 0 || game.status !== 'playing') {
            return this._eval(game, aiPlayer, opponent);
        }
        const moves = game.getAvailableMoves();
        if (moves.length === 0) return 0;

        if (isMax) {
            let maxEval = -Infinity;
            const ordered = this._orderMoves(moves, game, aiPlayer, opponent);
            for (const pos of ordered) {
                const s = game.clone();
                s.placePiece(pos);
                if (s.status !== 'playing') {
                    if (s.winner === aiPlayer) return 10000 + depth;
                    if (s.winner === opponent) return -10000 - depth;
                    if (s.status === 'draw') return 0;
                    continue;
                }
                const e = this._minimax(s, depth - 1, alpha, beta, false, aiPlayer, opponent);
                maxEval = Math.max(maxEval, e);
                alpha = Math.max(alpha, e);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            const ordered = this._orderMoves(moves, game, opponent, aiPlayer).reverse();
            for (const pos of ordered) {
                const s = game.clone();
                s.placePiece(pos);
                if (s.status !== 'playing') {
                    if (s.winner === opponent) return -10000 - depth;
                    if (s.winner === aiPlayer) return 10000 + depth;
                    if (s.status === 'draw') return 0;
                    continue;
                }
                const e = this._minimax(s, depth - 1, alpha, beta, true, aiPlayer, opponent);
                minEval = Math.min(minEval, e);
                beta = Math.min(beta, e);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    _orderMoves(moves, game, aiPlayer, opponent) {
        const currentPlayer = game.currentPlayer;
        return moves.map(pos => {
            let score = 0;
            const s = game.clone();
            s.placePiece(pos);
            if (s.winner === currentPlayer) score += 10000;
            const s2 = game.clone();
            const opp = currentPlayer === 'white' ? 'blue' : 'white';
            s2.currentPlayer = opp;
            if (s2.placePiece(pos).winner === opp) score += 5000;
            if (pos === 4) score += 100;
            if ([0,2,6,8].includes(pos)) score += 50;
            return { pos, score };
        }).sort((a, b) => b.score - a.score).map(s => s.pos);
    }
}


// ============================================================
// 三、UI 渲染器
// ============================================================

class GameUI {
    constructor() {
        this.boardEl = document.getElementById('board');
    }

    /** 切换屏幕 */
    showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById('screen-' + name);
        if (el) el.classList.add('active');
    }

    /** 渲染整个棋盘 */
    renderBoard(game) {
        const cells = this.boardEl.querySelectorAll('.cell');
        cells.forEach(cell => {
            const pos = parseInt(cell.dataset.pos);
            const content = cell.querySelector('.cell-content');
            cell.classList.remove('occupied', 'win-cell');

            if (game.board[pos]) {
                cell.classList.add('occupied');
                const age = game.getPieceAge(game.board[pos], pos);
                content.innerHTML = this._pieceHTML(game.board[pos], age, false);
            } else {
                content.innerHTML = '';
            }

            if (game.winningCells.includes(pos)) {
                cell.classList.add('win-cell');
            }
        });
    }

    /** 棋子 HTML 片段 */
    _pieceHTML(player, age, isNew) {
        const cls = player === 'white' ? 'piece-moon' : 'piece-star';
        const ageCls = isNew ? '' : `age-${age}`;
        let sparkHTML = '';
        if (player === 'blue') {
            for (let i = 1; i <= 5; i++) {
                sparkHTML += `<span class="spark spark-${i}"></span>`;
            }
        }
        return `<div class="${cls} ${ageCls}" style="animation:${isNew ? 'placePiece 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none'}">${sparkHTML}</div>`;
    }

    /** 落子动画 */
    animatePlacement(pos, player) {
        const cell = this.boardEl.querySelector(`[data-pos="${pos}"]`);
        if (!cell) return;
        cell.classList.add('occupied');
        const content = cell.querySelector('.cell-content');
        content.innerHTML = this._pieceHTML(player, 0, true);
    }

    /** 淘汰动画 */
    animateElimination(pos) {
        if (pos === null || pos === undefined) return;
        const cell = this.boardEl.querySelector(`[data-pos="${pos}"]`);
        if (!cell) return;
        const piece = cell.querySelector('.piece-moon, .piece-star');
        if (piece) {
            piece.classList.add('eliminating');
            piece.addEventListener('animationend', () => {
                cell.querySelector('.cell-content').innerHTML = '';
                cell.classList.remove('occupied');
            }, { once: true });
        }
    }

    /** 更新状态栏 */
    updateStatus(game) {
        // 回合文字
        const turnText = document.querySelector('[data-turn]');
        const roundEl = document.querySelector('[data-round]');
        if (turnText) {
            turnText.textContent = game.currentPlayer === 'white' ? '你的回合' : 'AI 回合';
        }
        if (roundEl) {
            roundEl.textContent = game.moveCount;
        }

        // 棋子点
        this._updateDots('white', game.whiteQueue.length);
        this._updateDots('blue', game.blueQueue.length);
    }

    _updateDots(player, count) {
        const container = document.querySelector(`.player-pieces[data-pieces="${player}"]`);
        if (!container) return;
        const dots = container.querySelectorAll('.piece-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('filled', i < count);
        });
    }

    /** 高亮获胜格子 */
    highlightWinCells(cells) {
        cells.forEach(pos => {
            const cell = this.boardEl.querySelector(`[data-pos="${pos}"]`);
            if (cell) cell.classList.add('win-cell');
        });
    }

    /** AI 思考动画 */
    showAIThinking(show) {
        const el = document.getElementById('ai-thinking');
        if (el) {
            if (show) el.removeAttribute('hidden');
            else el.setAttribute('hidden', '');
        }
    }

    /** 棋盘交互 */
    setBoardInteractive(on) {
        this.boardEl.style.pointerEvents = on ? 'auto' : 'none';
    }

    /** 胜利粒子 */
    createVictoryParticles() {
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;inset:0;z-index:200;pointer-events:none;';
        document.body.appendChild(container);
        const colors = ['#F5F3CE', '#D4AF37', '#FFD700', '#FFFFFF', '#FFA500', '#74A9FF'];
        for (let i = 0; i < 35; i++) {
            const p = document.createElement('div');
            const size = Math.random() * 8 + 4;
            p.style.cssText = `
                position:absolute;
                border-radius:50%;
                left:${Math.random()*100}%;
                top:${Math.random()*100}%;
                width:${size}px;height:${size}px;
                background:${colors[Math.floor(Math.random()*colors.length)]};
                box-shadow:0 0 ${size*2}px currentColor;
                animation:particleFly 1.8s ease-out forwards;
                animation-delay:${Math.random()*0.4}s;
            `;
            container.appendChild(p);
        }
        setTimeout(() => container.remove(), 2400);
    }

    /** 显示弹窗 */
    showModal(type) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.setAttribute('hidden', ''));
        const modal = document.getElementById('modal-' + type);
        if (modal) modal.removeAttribute('hidden');
    }

    /** 关闭弹窗 */
    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.setAttribute('hidden', ''));
    }

    /** 震动反馈（落子失败） */
    shakeCell(pos) {
        const cell = this.boardEl.querySelector(`[data-pos="${pos}"]`);
        if (!cell) return;
        cell.style.animation = 'none';
        void cell.offsetHeight;
        cell.style.animation = 'shake 0.3s ease';
        cell.addEventListener('animationend', () => cell.style.animation = '', { once: true });
    }
}


// ============================================================
// 四、应用主控制器
// ============================================================

class AppController {
    constructor() {
        this.engine = new MoonChessEngine();
        this.ui = new GameUI();
        this.ai = null;
        this.gameMode = null;       // 'pvp' | 'pve'
        this.aiDifficulty = null;   // 'easy' | 'medium' | 'hard'
        this.isAIThinking = false;

        this._init();
    }

    _init() {
        // 棋盘点击
        this.ui.boardEl.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const pos = parseInt(cell.dataset.pos);
            this._handleCellClick(pos);
        });

        // 全局按钮统一处理
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            switch (action) {
                case 'goto-home':
                    this.ui.showScreen('home');
                    this.ui.closeModals();
                    break;
                case 'goto-mode':
                    if (btn.dataset.mode === 'pvp') { this.startGame('pvp'); return; }
                    this.ui.showScreen('mode');
                    break;
                case 'goto-difficulty':
                    this.ui.showScreen('difficulty');
                    break;
                case 'start-pve':
                    this.startGame('pve', this._getSelectedDifficulty());
                    break;
                case 'close-modal':
                    this.ui.closeModals();
                    break;
                case 'restart':
                    this.ui.closeModals();
                    this.restartGame();
                    break;
                case 'surrender':
                    this._surrender();
                    break;
                case 'undo':
                    this._undo();
                    break;
            }
        });
    }

    /** 获取选中的难度 */
    _getSelectedDifficulty() {
        const selected = document.querySelector('.diff-circle.selected');
        return selected ? selected.dataset.difficulty : 'medium';
    }

    /** 开始游戏 */
    startGame(mode, difficulty = null) {
        this.gameMode = mode;
        this.aiDifficulty = difficulty;
        this.engine.reset();
        this.isAIThinking = false;

        if (mode === 'pve') {
            this.ai = new AIController(difficulty);
            // 更新 game UI 上的标签
            const blueTag = document.querySelector('.player-blue .player-tag');
            if (blueTag) {
                const diffNames = { easy: '简单', medium: '普通', hard: '困难' };
                blueTag.textContent = `（AI-${diffNames[difficulty] || '普通'}）`;
            }
        } else {
            this.ai = null;
            const blueTag = document.querySelector('.player-blue .player-tag');
            if (blueTag) blueTag.textContent = '（蓝方）';
        }

        this.ui.showScreen('game');
        this.ui.renderBoard(this.engine);
        this.ui.updateStatus(this.engine);
        this.ui.setBoardInteractive(true);
        this.ui.showAIThinking(false);
        this.ui.closeModals();
    }

    restartGame() {
        this.startGame(this.gameMode, this.aiDifficulty);
    }

    _handleCellClick(pos) {
        if (this.engine.status !== 'playing') return;
        if (this.isAIThinking) return;
        if (this.gameMode === 'pve' && this.engine.currentPlayer !== 'white') return;

        this._executeMove(pos);
    }

    _executeMove(pos) {
        const result = this.engine.placePiece(pos);

        if (!result.success) {
            this.ui.shakeCell(pos);
            return;
        }

        // 确定刚刚落子的玩家
        const placedPlayer = this.engine.whiteQueue.includes(pos) ? 'white' : 'blue';

        // 落子动画
        this.ui.animatePlacement(pos, placedPlayer);

        // 淘汰动画
        const animDelay = result.eliminated !== null ? 600 : 350;
        if (result.eliminated !== null) {
            setTimeout(() => this.ui.animateElimination(result.eliminated), 300);
        }

        // 更新棋盘
        setTimeout(() => {
            this.ui.renderBoard(this.engine);
            this.ui.updateStatus(this.engine);

            // 游戏结束？
            if (result.winner) {
                this.ui.highlightWinCells(result.winningCells);
                setTimeout(() => {
                    this.ui.createVictoryParticles();
                    this.ui.showModal(result.winner === 'white' ? 'win' : 'lose');
                }, 400);
                return;
            }

            if (this.engine.status === 'draw') {
                setTimeout(() => this.ui.showModal('draw'), 400);
                return;
            }

            // AI 回合
            if (this.gameMode === 'pve' && this.engine.currentPlayer === 'blue') {
                this._triggerAIMove();
            }
        }, animDelay);
    }

    _triggerAIMove() {
        if (!this.ai || this.engine.status !== 'playing') return;

        this.isAIThinking = true;
        this.ui.showAIThinking(true);
        this.ui.setBoardInteractive(false);

        setTimeout(() => {
            const move = this.ai.getMove(this.engine);

            this.isAIThinking = false;
            this.ui.showAIThinking(false);
            this.ui.setBoardInteractive(true);

            if (move >= 0) this._executeMove(move);
        }, 400);
    }

    _surrender() {
        if (this.engine.status !== 'playing') return;
        this.engine.status = this.gameMode === 'pve' ? 'blue_win' : (this.engine.currentPlayer === 'white' ? 'blue_win' : 'white_win');
        this.engine.winner = this.engine.status === 'white_win' ? 'white' : 'blue';
        this.ui.showModal(this.engine.winner === 'white' ? 'win' : 'lose');
    }

    _undo() {
        if (this.engine.status !== 'playing') return;
        if (this.gameMode === 'pve') {
            if (this.engine.currentPlayer !== 'white') return; // AI 回合不能悔棋
            if (!this.engine.undoAITurn()) return;
        } else {
            if (!this.engine.undo()) return;
        }
        this.ui.renderBoard(this.engine);
        this.ui.updateStatus(this.engine);
    }
}


// ============================================================
// 五、启动
// ============================================================

// 注入粒子 & shake 动画 keyframe
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFly {
            from { transform: translate(0,0) scale(1); opacity:1; }
            to { transform: translate(var(--dx,100px), var(--dy,-100px)) scale(0); opacity:0; }
        }
        @keyframes shake {
            0%,100% { transform:translateX(0); }
            25% { transform:translateX(-4px); }
            75% { transform:translateX(4px); }
        }
    `;
    document.head.appendChild(style);
}

// 启动应用
window.App = new AppController();
