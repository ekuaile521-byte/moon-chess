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
// 〇、皮肤系统
// ============================================================

const SKINS = [
    {
        id: 'classic',
        name: '经典月亮',
        desc: '最初的月亮与星辰',
        rarity: '普通',
        rarityColor: '#9CA3AF',
    },
    {
        id: 'crystal',
        name: '水晶琉璃',
        desc: '通透的粉晶与蓝水晶',
        rarity: '稀有',
        rarityColor: '#A78BFA',
        vars: {
            '--moon-bg': 'radial-gradient(circle at 30% 30%, #FFE8F0 0%, #FFC0DC 12%, #FF8FC0 30%, #E85A95 55%, #B83070 78%, #701540 100%)',
            '--moon-glow-outer': 'drop-shadow(0 0 10px rgba(255,140,200,0.75))',
            '--moon-glow-inner': 'drop-shadow(0 0 18px rgba(255,120,190,0.5))',
            '--moon-crater-color': 'rgba(200, 80, 140, 0.35)',
            '--moon-crater-color2': 'rgba(180, 60, 120, 0.3)',
            '--moon-crater-color3': 'rgba(220, 100, 160, 0.25)',
            '--moon-crater-color4': 'rgba(190, 70, 130, 0.32)',
            '--moon-crater-color5': 'rgba(210, 90, 150, 0.28)',
            '--moon-highlight': 'rgba(255, 255, 255, 0.55)',
            '--moon-shadow': 'rgba(180, 60, 120, 0.25)',
            '--moon-win-glow1': 'drop-shadow(0 0 16px rgba(255,140,200,0.9))',
            '--moon-win-glow2': 'drop-shadow(0 0 32px rgba(255,100,180,0.6))',
            '--moon-win-glow3': 'drop-shadow(0 0 48px rgba(255,80,170,0.45))',
            '--star-bg': 'radial-gradient(circle at 32% 28%, #E0F0FF 0%, #90C8FF 15%, #5090E8 38%, #2858B8 60%, #103078 82%, #051038 100%)',
            '--star-glow-outer': 'drop-shadow(0 0 10px rgba(100,180,255,0.8))',
            '--star-glow-inner': 'drop-shadow(0 0 18px rgba(80,160,255,0.5))',
            '--star-highlight': 'rgba(255, 255, 255, 0.4)',
            '--star-shadow': 'rgba(60, 120, 200, 0.3)',
            '--star-win-glow1': 'drop-shadow(0 0 16px rgba(100,180,255,0.9))',
            '--star-win-glow2': 'drop-shadow(0 0 32px rgba(80,160,255,0.6))',
            '--star-win-glow3': 'drop-shadow(0 0 48px rgba(60,140,255,0.45))',
        }
    },
    {
        id: 'ocean',
        name: '深海珍珠',
        desc: '深海珍珠 vs 赤红珊瑚',
        rarity: '史诗',
        rarityColor: '#F59E0B',
        vars: {
            '--moon-bg': 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #FFF5D8 10%, #FFE8A0 25%, #F5C860 45%, #D89830 65%, #A06010 85%, #503000 100%)',
            '--moon-glow-outer': 'drop-shadow(0 0 10px rgba(255,210,100,0.8))',
            '--moon-glow-inner': 'drop-shadow(0 0 18px rgba(255,190,80,0.5))',
            '--moon-crater-color': 'rgba(200, 150, 60, 0.4)',
            '--moon-crater-color2': 'rgba(180, 130, 50, 0.32)',
            '--moon-crater-color3': 'rgba(220, 170, 80, 0.28)',
            '--moon-crater-color4': 'rgba(190, 140, 55, 0.36)',
            '--moon-crater-color5': 'rgba(210, 160, 70, 0.3)',
            '--moon-highlight': 'rgba(255, 255, 255, 0.5)',
            '--moon-shadow': 'rgba(180, 120, 40, 0.25)',
            '--moon-win-glow1': 'drop-shadow(0 0 16px rgba(255,210,100,0.95))',
            '--moon-win-glow2': 'drop-shadow(0 0 32px rgba(255,180,60,0.65))',
            '--moon-win-glow3': 'drop-shadow(0 0 48px rgba(255,150,30,0.5))',
            '--star-bg': 'radial-gradient(circle at 32% 28%, #FFE8E0 0%, #FF9070 18%, #E84028 40%, #A81810 62%, #600808 82%, #280000 100%)',
            '--star-glow-outer': 'drop-shadow(0 0 10px rgba(255,100,70,0.8))',
            '--star-glow-inner': 'drop-shadow(0 0 18px rgba(255,70,40,0.5))',
            '--star-highlight': 'rgba(255, 255, 255, 0.35)',
            '--star-shadow': 'rgba(180, 40, 20, 0.3)',
            '--star-win-glow1': 'drop-shadow(0 0 16px rgba(255,100,70,0.9))',
            '--star-win-glow2': 'drop-shadow(0 0 32px rgba(255,70,40,0.6))',
            '--star-win-glow3': 'drop-shadow(0 0 48px rgba(255,50,20,0.45))',
        }
    },
];

class SkinManager {
    constructor() {
        this.storageKey = 'moon-chess-skin';
        this.currentSkin = this._load();
        this._apply(this.currentSkin);
    }

    _load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved && SKINS.find(s => s.id === saved)) return saved;
        } catch (e) {}
        return 'classic';
    }

    _save() {
        try {
            localStorage.setItem(this.storageKey, this.currentSkin);
        } catch (e) {}
    }

    _apply(skinId) {
        const skin = SKINS.find(s => s.id === skinId);
        if (!skin || !skin.vars) return;
        const root = document.documentElement;
        for (const [key, value] of Object.entries(skin.vars)) {
            root.style.setProperty(key, value);
        }
    }

    setSkin(skinId) {
        const skin = SKINS.find(s => s.id === skinId);
        if (!skin) return false;

        if (skin.id === 'classic') {
            const root = document.documentElement;
            const allVars = [
                '--moon-bg','--moon-glow-outer','--moon-glow-inner','--moon-glow-base',
                '--moon-crater-color','--moon-crater-color2','--moon-crater-color3',
                '--moon-crater-color4','--moon-crater-color5','--moon-highlight',
                '--moon-shadow','--moon-win-glow1','--moon-win-glow2','--moon-win-glow3',
                '--star-bg','--star-glow-outer','--star-glow-inner','--star-glow-base',
                '--star-highlight','--star-shadow','--star-win-glow1','--star-win-glow2','--star-win-glow3'
            ];
            allVars.forEach(v => root.style.removeProperty(v));
        } else {
            this._apply(skinId);
        }

        this.currentSkin = skinId;
        this._save();
        return true;
    }

    getCurrentSkin() {
        return SKINS.find(s => s.id === this.currentSkin);
    }

    getAllSkins() {
        return SKINS.map(s => ({
            ...s,
            active: s.id === this.currentSkin,
        }));
    }
}

// ============================================================
// 〇、战绩管理
// ============================================================

class StatsManager {
    constructor() {
        this.key = 'moon-chess-stats';
        this.data = this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, totalGames: 0 };
    }

    _save() {
        try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {}
    }

    record(result) {
        this.data.totalGames++;
        if (result === 'win') {
            this.data.wins++;
            this.data.streak++;
            if (this.data.streak > this.data.bestStreak) this.data.bestStreak = this.data.streak;
        } else if (result === 'lose') {
            this.data.losses++;
            this.data.streak = 0;
        } else {
            this.data.draws++;
            this.data.streak = 0;
        }
        this._save();
    }

    getStats() { return { ...this.data }; }

    reset() {
        this.data = { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, totalGames: 0 };
        this._save();
    }
}


// ============================================================
// 零、音效管理器
// ============================================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.key = 'moon-chess-sound';
        const saved = this._load();
        this.sfxEnabled = saved.sfx !== false;
        this.bgmEnabled = saved.bgm === true;
        this.bgmOscillators = [];
        this.bgmGain = null;
    }

    _load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {};
    }

    _save() {
        try {
            localStorage.setItem(this.key, JSON.stringify({
                sfx: this.sfxEnabled,
                bgm: this.bgmEnabled,
            }));
        } catch (e) {}
    }

    _ensureCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    /** 预热音频上下文（在首次用户交互时调用） */
    warmup() {
        if (!this.ctx) {
            this._ensureCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    _playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
        if (!this.enabled || !this.sfxEnabled) return;
        try {
            const ctx = this._ensureCtx();
            if (ctx.state === 'suspended') return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + duration);
        } catch (e) { /* 静默失败 */ }
    }

    startBgm() {
        if (!this.enabled || !this.bgmEnabled) return;
        this.stopBgm();
        try {
            const ctx = this._ensureCtx();
            this.bgmGain = ctx.createGain();
            this.bgmGain.gain.setValueAtTime(0, ctx.currentTime);
            this.bgmGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
            this.bgmGain.connect(ctx.destination);

            const baseFreqs = [220, 277.18, 329.63, 440];
            baseFreqs.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                const oscGain = ctx.createGain();
                oscGain.gain.setValueAtTime(0.25, ctx.currentTime);
                const lfo = ctx.createOscillator();
                lfo.frequency.setValueAtTime(0.15 + i * 0.05, ctx.currentTime);
                const lfoGain = ctx.createGain();
                lfoGain.gain.setValueAtTime(2, ctx.currentTime);
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                osc.connect(oscGain);
                oscGain.connect(this.bgmGain);
                osc.start();
                lfo.start();
                this.bgmOscillators.push({ osc, lfo, oscGain });
            });
        } catch (e) { /* 静默失败 */ }
    }

    stopBgm() {
        if (this.bgmGain && this.ctx) {
            try {
                const ctx = this.ctx;
                this.bgmGain.gain.cancelScheduledValues(ctx.currentTime);
                this.bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
                setTimeout(() => {
                    this.bgmOscillators.forEach(({ osc, lfo }) => {
                        try { osc.stop(); lfo.stop(); } catch (e) {}
                    });
                    this.bgmOscillators = [];
                    if (this.bgmGain) {
                        this.bgmGain.disconnect();
                        this.bgmGain = null;
                    }
                }, 900);
            } catch (e) {}
        }
    }

    playPlace(player = 'white') {
        if (player === 'white') {
            // 金色月亮：温暖清脆 880Hz -> 1320Hz
            this._playTone(880, 0.1, 'sine', 0.14);
            this._playTone(1320, 0.08, 'sine', 0.08, 0.04);
        } else {
            // 蓝色星空：空灵低沉 660Hz -> 990Hz
            this._playTone(660, 0.1, 'triangle', 0.14);
            this._playTone(990, 0.08, 'triangle', 0.08, 0.04);
        }
    }

    playEliminate() {
        // 低频嗡鸣下降
        this._playTone(200, 0.25, 'sine', 0.12);
        this._playTone(120, 0.3, 'sine', 0.08, 0.05);
    }

    playWin() {
        // 上行琶音 C-E-G-C
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => this._playTone(freq, 0.3, 'sine', 0.1, i * 0.12));
    }

    playLose() {
        // 下行 G-E-C
        const notes = [784, 659, 523];
        notes.forEach((freq, i) => this._playTone(freq, 0.25, 'sine', 0.1, i * 0.15));
    }

    playDraw() {
        // 平稳双音
        this._playTone(440, 0.3, 'triangle', 0.08);
        this._playTone(523, 0.3, 'triangle', 0.08, 0.15);
    }

    playClick() {
        this._playTone(600, 0.06, 'sine', 0.06);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        this._save();
        return this.sfxEnabled;
    }

    toggleBgm() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) {
            this.startBgm();
        } else {
            this.stopBgm();
        }
        this._save();
        return this.bgmEnabled;
    }
}


// ============================================================
// 一、纯游戏逻辑引擎
// ============================================================

class MoonChessEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = Array(9).fill(null);
        this.whiteQueue = [];
        this.blueQueue = [];
        this.currentPlayer = 'white';
        this.moveCount = 0;
        this.status = 'playing';
        this.winner = null;
        this.winningCells = [];
        this.lastEliminated = null;
        this.history = [];
        this.noEliminationMoves = 0;
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
            noEliminationMoves: this.noEliminationMoves,
        });

        // 步骤 1：放置棋子
        this.board[pos] = player;
        queue.push(pos);
        this.moveCount++;

        // 步骤 2：检查胜利（先判断，保证规则正确）
        const winResult = this._checkWin(player);

        // 步骤 3：FIFO 淘汰（保持最多3枚）
        let eliminated = null;
        if (queue.length > 3) {
            if (winResult) {
                // 获胜时：优先淘汰不在获胜连线上的最老棋子
                // 这样获胜连线的3颗棋子都保留在场上
                let elimIdx = -1;
                for (let i = 0; i < queue.length; i++) {
                    if (!winResult.includes(queue[i])) {
                        elimIdx = i;
                        break;
                    }
                }
                if (elimIdx >= 0) {
                    eliminated = queue[elimIdx];
                    queue.splice(elimIdx, 1);
                } else {
                    eliminated = queue.shift();
                }
            } else {
                eliminated = queue.shift();
            }
            this.board[eliminated] = null;
            this.noEliminationMoves = 0;
        } else {
            this.noEliminationMoves++;
        }
        this.lastEliminated = eliminated;

        // 步骤 4：处理胜利
        if (winResult) {
            this.status = player === 'white' ? 'white_win' : 'blue_win';
            this.winner = player;
            this.winningCells = winResult;
            return {
                success: true, player, eliminated,
                winner: player, winningCells: winResult,
                message: '获胜！',
            };
        }

        // 步骤 5：平局判定
        if (this.moveCount >= 80 || this.noEliminationMoves >= 30) {
            this.status = 'draw';
            return { success: true, player, eliminated, winner: null, winningCells: [], message: '平局' };
        }

        // 步骤 6：切换玩家
        this.currentPlayer = player === 'white' ? 'blue' : 'white';

        return { success: true, player, eliminated, winner: null, winningCells: [], message: '继续' };
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
        c.noEliminationMoves = this.noEliminationMoves;
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
        this.noEliminationMoves = prev.noEliminationMoves || 0;
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

        // 开局随机：前2步以70%概率走中心或角落，30%随机
        if (game.moveCount <= 1) {
            if (Math.random() < 0.3) {
                return moves[Math.floor(Math.random() * moves.length)];
            }
        }

        // 优先中心（但有20%概率跳过）
        if (moves.includes(4) && Math.random() < 0.8) return 4;

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

        // 评分（从 top-N 最优走法中随机选择，避免同步骤稳胜）
        const scored = moves.map(pos => {
            const s = game.clone();
            s.placePiece(pos);
            return { pos, score: this._eval(s, aiPlayer, opponent) };
        });
        scored.sort((a, b) => b.score - a.score);
        const topN = Math.min(scored.length, 3);
        const threshold = scored[0].score * 0.85;
        const candidates = scored.filter(s => s.score >= threshold).slice(0, topN);
        return candidates[Math.floor(Math.random() * candidates.length)].pos;
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
        // 微量随机扰动（避免同局面完全确定性）
        score += (Math.random() - 0.5) * 2;
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
        const ordered = this._orderMoves(moves, game, aiPlayer, opponent);
        const scored = [];

        for (const pos of ordered) {
            const s = game.clone();
            s.placePiece(pos);
            if (s.status !== 'playing') {
                if (s.winner === aiPlayer) return pos;
                continue;
            }
            const score = this._minimax(s, depth - 1, -Infinity, Infinity, false, aiPlayer, opponent);
            scored.push({ pos, score });
        }
        scored.sort((a, b) => b.score - a.score);
        // 从分数差距在10%以内的 top 走法中随机选择
        const threshold = scored[0].score - Math.abs(scored[0].score) * 0.1 - 5;
        const candidates = scored.filter(s => s.score >= threshold).slice(0, 3);
        return candidates[Math.floor(Math.random() * candidates.length)].pos;
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
        this._initDOMRefs();
    }

    /** 缓存常用 DOM 引用，避免每次方法调用都重复查询 */
    _initDOMRefs() {
        this.turnTextEl = document.querySelector('[data-turn]');
        this.roundEl = document.querySelector('[data-round]');
        this.playerWhiteName = document.querySelector('.player-white .player-name');
        this.playerBlueName = document.querySelector('.player-blue .player-name');
        this.playerWhiteCell = document.querySelector('.player-cell.player-white');
        this.playerBlueCell = document.querySelector('.player-cell.player-blue');
        this.aiThinkingEl = document.querySelector('.ai-thinking');
        this.undoBtn = document.querySelector('[data-action="undo"]');
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
        const ageCls = isNew ? 'piece-new' : `age-${age}`;
        let sparkHTML = '';
        if (player === 'blue') {
            for (let i = 1; i <= 5; i++) {
                sparkHTML += `<span class="spark spark-${i}"></span>`;
            }
        }
        return `<div class="${cls} ${ageCls}">${sparkHTML}</div>`;
    }

    /** 落子动画 */
    animatePlacement(pos, player) {
        const cell = this.boardEl.querySelector(`[data-pos="${pos}"]`);
        if (!cell) return;
        cell.classList.add('occupied');
        const content = cell.querySelector('.cell-content');
        content.innerHTML = this._pieceHTML(player, 0, true);

        // 落子涟漪效果
        const ripple = document.createElement('div');
        ripple.className = 'piece-ripple';
        cell.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    /** 淘汰动画 + 粒子消散 */
    animateElimination(pos) {
        if (pos === null || pos === undefined) return;
        const cell = this.boardEl.querySelector(`[data-pos="${pos}"]`);
        if (!cell) return;
        const piece = cell.querySelector('.piece-moon, .piece-star');
        if (piece) {
            const isMoon = piece.classList.contains('piece-moon');
            const rect = cell.getBoundingClientRect();
            this._createEliminationParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, isMoon);
            piece.style.animation = 'none';
            void piece.offsetHeight;
            piece.classList.add('eliminating');
            piece.style.animation = isMoon
                ? 'eliminateMoon 1.2s ease-in-out forwards'
                : 'eliminateStar 1.2s ease-in-out forwards';
            piece.addEventListener('animationend', () => {
                cell.querySelector('.cell-content').innerHTML = '';
                cell.classList.remove('occupied');
            }, { once: true });
        }
    }

    /** 淘汰粒子 — 向上飘散 */
    _createEliminationParticles(x, y, isMoon) {
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;left:0;top:0;z-index:150;pointer-events:none;';
        document.body.appendChild(container);
        const color = isMoon ? '255,235,160' : '160,200,255';
        for (let i = 0; i < 8; i++) {
            const p = document.createElement('div');
            const angle = (Math.PI * (i / 7) - Math.PI / 2) + (Math.random() - 0.5) * 0.8;
            const dist = 50 + Math.random() * 40;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist - 20;
            const size = 2 + Math.random() * 3;
            const delay = Math.random() * 0.15;
            p.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:50%;background:rgba(${color},${0.5 + Math.random() * 0.4});box-shadow:0 0 ${size * 2}px rgba(${color},0.5);transform:translate(-50%,-50%);opacity:0;transition:transform 1.1s cubic-bezier(0.16,1,0.3,1),opacity 1.1s ease-out;transition-delay:${delay}s;`;
            container.appendChild(p);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`;
                    p.style.opacity = '0';
                });
            });
            p.style.opacity = '0.8';
        }
        setTimeout(() => container.remove(), 1400);
    }

    /** 更新状态栏 */
    updateStatus(game, gameMode = 'pve') {
        if (this.turnTextEl) {
            if (gameMode === 'pvp') {
                this.turnTextEl.textContent = game.currentPlayer === 'white' ? '白方回合' : '蓝方回合';
                this.turnTextEl.style.color = game.currentPlayer === 'white' ? 'var(--moon)' : 'var(--star)';
                this.turnTextEl.style.textShadow = game.currentPlayer === 'white'
                    ? '0 0 8px var(--moon-glow)'
                    : '0 0 8px var(--star-glow)';
            } else {
                this.turnTextEl.textContent = game.currentPlayer === 'white' ? '你的回合' : 'AI 回合';
                this.turnTextEl.style.color = '';
                this.turnTextEl.style.textShadow = '';
            }
        }
        if (this.roundEl) {
            this.roundEl.textContent = game.moveCount;
        }
        if (this.playerWhiteName) {
            this.playerWhiteName.innerHTML = gameMode === 'pvp'
                ? '白棋 <span class="player-tag">（玩家1）</span>'
                : '白棋 <span class="player-tag">（你）</span>';
        }
        if (this.playerBlueName) {
            this.playerBlueName.innerHTML = gameMode === 'pvp'
                ? '蓝棋 <span class="player-tag">（玩家2）</span>'
                : '蓝棋 <span class="player-tag">（AI）</span>';
        }
        if (this.playerWhiteCell) {
            this.playerWhiteCell.style.opacity = game.currentPlayer === 'white' ? '1' : '0.6';
        }
        if (this.playerBlueCell) {
            this.playerBlueCell.style.opacity = game.currentPlayer === 'blue' ? '1' : '0.6';
        }
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

    /** 画获胜连线 */
    drawWinLine(winningCells) {
        document.querySelectorAll('.win-line-svg').forEach(el => el.remove());
        if (!winningCells || winningCells.length < 3) return;

        const boardEl = this.boardEl;
        const boardRect = boardEl.getBoundingClientRect();
        const cells = winningCells.map(pos => {
            const cellEl = boardEl.querySelector(`[data-pos="${pos}"]`);
            const rect = cellEl.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - boardRect.left,
                y: rect.top + rect.height / 2 - boardRect.top
            };
        });

        const dx = cells[2].x - cells[0].x;
        const dy = cells[2].y - cells[0].y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('win-line-svg');
        svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
        svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', cells[0].x);
        line.setAttribute('y1', cells[0].y);
        line.setAttribute('x2', cells[2].x);
        line.setAttribute('y2', cells[2].y);
        line.setAttribute('stroke', '#F5F3CE');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-dasharray', lineLength);
        line.setAttribute('stroke-dashoffset', lineLength);
        line.style.cssText = `filter: drop-shadow(0 0 6px rgba(245,243,206,0.8)) drop-shadow(0 0 12px rgba(245,243,206,0.4)); transition: stroke-dashoffset 0.8s ease-out;`;

        svg.appendChild(line);

        const glowLine = line.cloneNode();
        glowLine.setAttribute('stroke-width', '8');
        glowLine.setAttribute('stroke', 'rgba(245,243,206,0.2)');
        glowLine.style.filter = 'blur(4px)';
        svg.insertBefore(glowLine, line);

        boardEl.style.position = 'relative';
        boardEl.appendChild(svg);

        requestAnimationFrame(() => {
            setTimeout(() => {
                line.setAttribute('stroke-dashoffset', 0);
                glowLine.setAttribute('stroke-dashoffset', 0);
            }, 300);
        });
    }

    /** AI 思考动画 */
    showAIThinking(show) {
        if (this.aiThinkingEl) {
            if (show) this.aiThinkingEl.removeAttribute('hidden');
            else this.aiThinkingEl.setAttribute('hidden', '');
        }
    }

    /** 棋盘交互 */
    setBoardInteractive(on) {
        this.boardEl.style.pointerEvents = on ? 'auto' : 'none';
    }

    /** 胜利粒子 */
    createVictoryParticles() {
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;inset:0;z-index:200;pointer-events:none;overflow:hidden;';
        document.body.appendChild(container);
        const colors = ['#F5F3CE', '#D4AF37', '#FFD700', '#FFFFFF', '#FFA500', '#74A9FF'];
        for (let i = 0; i < 35; i++) {
            const p = document.createElement('div');
            const size = Math.random() * 8 + 4;
            const dx = (Math.random() - 0.5) * 400;
            const dy = -Math.random() * 300 - 100;
            p.style.cssText = `
                position:absolute;
                border-radius:50%;
                left:${Math.random()*100}%;
                top:${Math.random()*100}%;
                width:${size}px;height:${size}px;
                background:${colors[Math.floor(Math.random()*colors.length)]};
                box-shadow:0 0 ${size*2}px currentColor;
                --dx:${dx}px;
                --dy:${dy}px;
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
        document.querySelectorAll('.win-line-svg').forEach(el => el.remove());
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
        this.sound = new SoundManager();
        this.ai = null;
        this.gameMode = null;
        this.aiDifficulty = null;
        this.isAIThinking = false;
        this.undoCount = 0;
        this.maxUndo = 3;

        this.stats = new StatsManager();
        this.skin = new SkinManager();
        this._updateStatsUI();
        this._renderSkinList();

        this._initUIState();
        this._init();
    }

    _initUIState() {
        const diffMedium = document.querySelector('.diff-circle[data-difficulty="medium"]');
        if (diffMedium) diffMedium.classList.add('selected');

        document.querySelectorAll('.sound-btn').forEach(btn => {
            if (btn.getAttribute('aria-label') === '音乐' || btn.dataset.action === 'toggle-bgm') {
                btn.dataset.action = 'toggle-bgm';
                btn.classList.toggle('active', this.sound.bgmEnabled);
            }
            if (btn.getAttribute('aria-label') === '音效' || btn.dataset.action === 'toggle-sfx') {
                btn.dataset.action = 'toggle-sfx';
                btn.classList.toggle('active', this.sound.sfxEnabled);
            }
        });

        document.querySelectorAll('.toggle-btn[data-action="toggle-bgm"]').forEach(btn => {
            btn.classList.toggle('active', this.sound.bgmEnabled);
        });
        document.querySelectorAll('.toggle-btn[data-action="toggle-sfx"]').forEach(btn => {
            btn.classList.toggle('active', this.sound.sfxEnabled);
        });
    }

    _renderSkinList() {
        const listEl = document.getElementById('skin-list');
        if (!listEl) return;

        const classicMoonBg = 'radial-gradient(circle at 30% 30%, #FFFBE6 0%, #FFEDB8 10%, #F5E39A 25%, #E6C872 45%, #D4A855 65%, #C08A3A 82%, #8B5E20 100%)';
        const classicStarBg = 'radial-gradient(circle at 32% 28%, #B8D4FF 0%, #7AA8FF 15%, #4A7AE8 35%, #2D4FA8 55%, #1A2E6B 75%, #0D1A45 100%)';
        const classicMoonGlow = 'drop-shadow(0 0 8px rgba(245, 243, 206, 0.7)) drop-shadow(0 0 16px rgba(245, 243, 206, 0.4))';
        const classicStarGlow = 'drop-shadow(0 0 8px rgba(116, 169, 255, 0.7)) drop-shadow(0 0 16px rgba(116, 169, 255, 0.4))';

        const skins = this.skin.getAllSkins();
        listEl.innerHTML = skins.map(skin => {
            const isClassic = skin.id === 'classic';
            const moonBg = isClassic ? classicMoonBg : (skin.vars ? skin.vars['--moon-bg'] : '');
            const starBg = isClassic ? classicStarBg : (skin.vars ? skin.vars['--star-bg'] : '');
            const moonGlow = isClassic ? classicMoonGlow : (skin.vars ? `${skin.vars['--moon-glow-outer']} ${skin.vars['--moon-glow-inner']}` : '');
            const starGlow = isClassic ? classicStarGlow : (skin.vars ? `${skin.vars['--star-glow-outer']} ${skin.vars['--star-glow-inner']}` : '');

            return `
            <div class="skin-card ${skin.active ? 'active' : ''}" data-skin="${skin.id}">
                <div class="skin-preview">
                    <div class="skin-preview-piece moon" style="background:${moonBg};filter:${moonGlow};"></div>
                    <div class="skin-preview-piece star" style="background:${starBg};filter:${starGlow};"></div>
                </div>
                <div class="skin-name">${skin.name}</div>
                <div class="skin-rarity" style="color:${skin.rarityColor}">${skin.rarity}</div>
            </div>
        `}).join('');

        listEl.querySelectorAll('.skin-card').forEach(card => {
            card.addEventListener('click', () => {
                const skinId = card.dataset.skin;
                this.skin.setSkin(skinId);
                listEl.querySelectorAll('.skin-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });
    }

    _init() {
        // 首次用户交互时预热音频上下文
        const warmupAudio = () => {
            this.sound.warmup();
            document.removeEventListener('pointerdown', warmupAudio);
        };
        document.addEventListener('pointerdown', warmupAudio);

        // 棋盘点击
        this.ui.boardEl.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const pos = parseInt(cell.dataset.pos);
            this._handleCellClick(pos);
        });

        // 全局按钮统一处理（事件映射表）
        this._actions = {
            'goto-home': () => {
                if (this.gameMode && this.engine.status === 'playing') {
                    this._confirmQuit();
                } else {
                    this.ui.showScreen('home');
                    this.ui.closeModals();
                }
            },
            'goto-mode': (btn) => {
                if (btn.dataset.mode === 'pvp') { this.startGame('pvp'); return; }
                this.ui.showScreen('mode');
            },
            'quick-start': () => this.startGame('pve', 'medium'),
            'goto-difficulty': () => this.ui.showScreen('difficulty'),
            'select-difficulty': (btn) => {
                document.querySelectorAll('.diff-circle').forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                this.sound.playClick();
            },
            'start-pve': () => this.startGame('pve', this._getSelectedDifficulty()),
            'close-modal': () => this.ui.closeModals(),
            'restart': () => {
                if (this.engine.status === 'playing') {
                    this._confirmRestart();
                } else {
                    this.ui.closeModals();
                    this.restartGame();
                }
            },
            'surrender': () => this._confirmSurrender(),
            'undo': () => this._undo(),
            'open-settings': () => this.ui.showModal('settings'),
            'toggle-sfx': (btn, e) => {
                const toggleBtn = e.target.closest('.toggle-btn');
                const enabled = this.sound.toggleSfx();
                if (toggleBtn) toggleBtn.classList.toggle('active', enabled);
                this._updateSoundButtons();
            },
            'toggle-bgm': (btn, e) => {
                const bgmBtn = e.target.closest('.sound-btn') || e.target.closest('.toggle-btn');
                const enabled = this.sound.toggleBgm();
                if (bgmBtn) bgmBtn.classList.toggle('active', enabled);
                this._updateSoundButtons();
            },
            'open-rules': () => this.ui.showModal('settings'),
            'reset-stats': () => this._confirmResetStats(),
            'confirm-surrender': () => { this.ui.closeModals(); this._surrender(); },
            'confirm-reset': () => { this.ui.closeModals(); this.stats.reset(); this._updateStatsUI(); },
            'confirm-quit': () => { this.ui.closeModals(); this.gameMode = null; this.ui.showScreen('home'); },
            'confirm-restart': () => { this.ui.closeModals(); this.restartGame(); },
        };

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const handler = this._actions[action];
            if (handler) handler(btn, e);
        });
    }

    _updateSoundButtons() {
        document.querySelectorAll('.sound-btn[data-action="toggle-sfx"]').forEach(btn => {
            btn.classList.toggle('active', this.sound.sfxEnabled);
        });
        document.querySelectorAll('.sound-btn[data-action="toggle-bgm"]').forEach(btn => {
            btn.classList.toggle('active', this.sound.bgmEnabled);
        });
        document.querySelectorAll('.toggle-btn[data-action="toggle-sfx"]').forEach(btn => {
            btn.classList.toggle('active', this.sound.sfxEnabled);
        });
        document.querySelectorAll('.toggle-btn[data-action="toggle-bgm"]').forEach(btn => {
            btn.classList.toggle('active', this.sound.bgmEnabled);
        });
    }

    _confirmSurrender() {
        if (this.engine.status !== 'playing') return;
        this.sound.playClick();
        this.ui.showModal('surrender-confirm');
    }

    _confirmQuit() {
        this.sound.playClick();
        this.ui.showModal('quit-confirm');
    }

    _confirmRestart() {
        this.sound.playClick();
        this.ui.showModal('restart-confirm');
    }

    _confirmResetStats() {
        this.sound.playClick();
        this.ui.showModal('reset-confirm');
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
        this.undoCount = 0;
        this._updateUndoButton();

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
        this.ui.updateStatus(this.engine, this.gameMode);
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

        // 落子动画
        this.ui.animatePlacement(pos, result.player);
        this.sound.playPlace(result.player);

        // 淘汰动画
        const animDelay = result.eliminated !== null ? 1600 : 350;
        if (result.eliminated !== null) {
            this.sound.playEliminate();
            setTimeout(() => this.ui.animateElimination(result.eliminated), 200);
        }

        // 更新棋盘
        setTimeout(() => {
            this.ui.renderBoard(this.engine);
            this.ui.updateStatus(this.engine, this.gameMode);

            // 游戏结束？
            if (result.winner) {
                this.ui.highlightWinCells(result.winningCells);
                setTimeout(() => this.ui.drawWinLine(result.winningCells), 200);
                setTimeout(() => {
                    this.ui.createVictoryParticles();
                    const whiteWins = result.winner === 'white';
                    if (this.gameMode === 'pve') {
                        if (whiteWins) {
                            this.sound.playWin();
                            this.stats.record('win');
                        } else {
                            this.sound.playLose();
                            this.stats.record('lose');
                        }
                        this._updateStatsUI();
                    } else {
                        this.sound.playWin();
                    }
                    if (this.gameMode === 'pve') {
                        this.ui.showModal(whiteWins ? 'win' : 'lose');
                    } else {
                        this.ui.showModal(whiteWins ? 'white-win' : 'blue-win');
                    }
                }, 400);
                return;
            }

            if (this.engine.status === 'draw') {
                setTimeout(() => {
                    this.sound.playDraw();
                    if (this.gameMode === 'pve') {
                        this.stats.record('draw');
                        this._updateStatsUI();
                    }
                    this.ui.showModal('draw');
                }, 400);
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
        if (this.isAIThinking) return;

        this.isAIThinking = true;
        this.ui.showAIThinking(true);
        this.ui.setBoardInteractive(false);

        const thinkTime = 350 + Math.random() * 250;

        setTimeout(() => {
            let move = -1;
            try {
                const startTime = performance.now();
                move = this.ai.getMove(this.engine);
                const elapsed = performance.now() - startTime;
                if (elapsed > 1500) {
                    console.warn('[AI] 计算耗时过长:', elapsed, 'ms');
                }
            } catch (e) {
                console.error('[AI] 计算出错:', e);
                move = -1;
            }

            if (move < 0) {
                const moves = this.engine.getAvailableMoves();
                if (moves.length > 0) {
                    move = moves[Math.floor(Math.random() * moves.length)];
                }
            }

            this.isAIThinking = false;
            this.ui.showAIThinking(false);

            if (this.engine.status !== 'playing') {
                this.ui.setBoardInteractive(false);
                return;
            }

            this.ui.setBoardInteractive(true);

            if (move >= 0) {
                this._executeMove(move);
            }
        }, thinkTime);
    }

    _surrender() {
        if (this.engine.status !== 'playing') return;
        const winner = this.engine.currentPlayer === 'white' ? 'blue' : 'white';
        this.engine.status = winner === 'white' ? 'white_win' : 'blue_win';
        this.engine.winner = winner;

        if (this.gameMode === 'pve') {
            const isPlayerWin = winner === 'white';
            this.stats.record(isPlayerWin ? 'win' : 'lose');
            this._updateStatsUI();
            this.ui.showModal(isPlayerWin ? 'win' : 'lose');
        } else {
            this.sound.playLose();
            this.ui.showModal(winner === 'white' ? 'white-win' : 'blue-win');
        }
    }

    _undo() {
        if (this.engine.status !== 'playing') return;
        if (this.undoCount >= this.maxUndo) return;
        if (this.gameMode === 'pve') {
            if (this.engine.currentPlayer !== 'white') return;
            if (!this.engine.undoAITurn()) return;
        } else {
            if (!this.engine.undo()) return;
        }
        this.undoCount++;
        this.ui.renderBoard(this.engine);
        this.ui.updateStatus(this.engine);
        this._updateUndoButton();
    }

    _updateUndoButton() {
        const btn = this.ui.undoBtn;
        if (!btn) return;
        const remaining = this.maxUndo - this.undoCount;
        const label = btn.querySelector('.undo-count') || (() => {
            const s = document.createElement('span');
            s.className = 'undo-count';
            s.style.cssText = 'font-size:10px;opacity:0.7;margin-top:2px;';
            btn.appendChild(s);
            return s;
        })();
        label.textContent = `${remaining}/${this.maxUndo}`;
        btn.style.opacity = remaining <= 0 ? '0.4' : '1';
    }

    _updateStatsUI() {
        const s = this.stats.getStats();
        document.querySelectorAll('[data-stat]').forEach(el => {
            const key = el.dataset.stat;
            if (key in s) el.textContent = s[key];
        });
    }
}


// ============================================================
// 四补、星空背景（Canvas 绘制）
// ============================================================

class Starfield {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.stars = [];
        this._rafId = null;
        this._lastTime = 0;

        this._initStars();
        this._resize();

        this._loop = this._loop.bind(this);
        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    _initStars() {
        const count = window.innerWidth < 480 ? 90 : 110;
        this.stars = [];
        for (let i = 0; i < count; i++) {
            const roll = Math.random();
            let size, baseAlpha, color;
            if (roll < 0.12) {
                // 大星 — 暖金色调
                size = 1.6 + Math.random() * 1.1;
                baseAlpha = 0.75 + Math.random() * 0.25;
                color = '245, 243, 206';
            } else if (roll < 0.45) {
                // 中星 — 暖白
                size = 1.0 + Math.random() * 0.7;
                baseAlpha = 0.55 + Math.random() * 0.35;
                color = '255, 255, 255';
            } else {
                // 微小星 — 暗白
                size = 0.4 + Math.random() * 0.6;
                baseAlpha = 0.3 + Math.random() * 0.45;
                color = '255, 255, 255';
            }
            this.stars.push({
                x: Math.random(),
                y: Math.random() * 0.72, // 偏向上方天空区域
                size,
                baseAlpha,
                color,
                speed: 0.4 + Math.random() * 1.4,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    _resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    _onResize() {
        this._resize();
    }

    start() {
        if (this._rafId) return;
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._loop);
    }

    stop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    _loop(now) {
        const dt = Math.min((now - this._lastTime) / 1000, 0.05);
        this._lastTime = now;
        this._draw(dt);
        this._rafId = requestAnimationFrame(this._loop);
    }

    _draw(dt) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        for (const s of this.stars) {
            s.phase += s.speed * dt;
            const tw = (Math.sin(s.phase) + 1) / 2; // 0..1
            const alpha = s.baseAlpha * (0.3 + 0.7 * tw);
            const x = s.x * this.width;
            const y = s.y * this.height;
            const r = s.size * (0.85 + 0.3 * tw);

            // 光晕（仅大星）
            if (s.size > 1.4) {
                ctx.beginPath();
                ctx.fillStyle = `rgba(${s.color}, ${(alpha * 0.18).toFixed(3)})`;
                ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.beginPath();
            ctx.fillStyle = `rgba(${s.color}, ${alpha.toFixed(3)})`;
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
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

// 启动 Canvas 星空背景
(function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const starfield = new Starfield(canvas);
    starfield.start();
    window.Starfield = starfield;
})();
