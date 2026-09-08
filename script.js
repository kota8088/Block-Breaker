const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ゲームの基本定数
const ballRadius = 8;
const paddleHeight = 12;
const paddleWidth = 75;
const brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 18;
const brickPadding = 10;
const brickOffsetTop = 45;
const brickOffsetLeft = 30;

// ゲームの状態変数
let x, y, dx, dy, paddleX;
let rightPressed = false;
let leftPressed = false;
let score = 0;
let stage = 1;
let bricks = [];
let traps = []; // 赤い罠玉の配列

// 状態管理: 'START', 'PLAYING', 'GAMEOVER'
let gameState = 'START';
let highScore = localStorage.getItem("infinity_high_score") || 0;

// イベントリスナー設定
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
canvas.addEventListener("click", canvasClickHandler, false);

// ボタン操作用（マウス＆タッチ両対応）
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

const setLeft = (val) => leftPressed = val;
const setRight = (val) => rightPressed = val;

btnLeft.addEventListener("mousedown", () => setLeft(true));
btnLeft.addEventListener("mouseup", () => setLeft(false));
btnLeft.addEventListener("mouseleave", () => setLeft(false));
btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); setLeft(true); });
btnLeft.addEventListener("touchend", () => setLeft(false));

btnRight.addEventListener("mousedown", () => setRight(true));
btnRight.addEventListener("mouseup", () => setRight(false));
btnRight.addEventListener("mouseleave", () => setRight(false));
btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); setRight(true); });
btnRight.addEventListener("touchend", () => setRight(false));

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

function canvasClickHandler() {
    if (gameState === 'START' || gameState === 'GAMEOVER') {
        score = 0;
        stage = 1;
        initStage();
        gameState = 'PLAYING';
    }
}

// ステージごとの初期化
function initStage() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    // ステージが上がるごとに初期速度を少しずつ上昇
    const speed = 2.5 + (stage * 0.3);
    dx = speed;
    dy = -speed;
    paddleX = (canvas.width - paddleWidth) / 2;
    traps = [];

    // ブロック生成（耐久力をランダムに設定）
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            // 30%の確率で2〜10回当てないと壊れない頑丈なブロックにする（通常は1）
            let maxHp = 1;
            if (Math.random() < 0.3) {
                maxHp = Math.floor(Math.random() * 9) + 2; // 2 ~ 10
            }
            bricks[c][r] = { x: 0, y: 0, hp: maxHp, maxHp: maxHp };
        }
    }
}

// ブロックの衝突判定
function collisionDetection() {
    let activeBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.hp > 0) {
                activeBricks++;
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.hp--;
                    score++;

                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem("infinity_high_score", highScore);
                    }

                    // ブロックが壊れたとき、25%の確率で赤い罠玉を生成
                    if (b.hp === 0 && Math.random() < 0.25) {
                        traps.push({
                            x: b.x + brickWidth / 2,
                            y: b.y + brickHeight,
                            speed: 2 + Math.random() * 1.5
                        });
                    }
                }
            }
        }
    }
    // すべて破壊したら次のステージへ自動生成
    if (activeBricks === 0 && gameState === 'PLAYING') {
        stage++;
        initStage();
    }
}

// 描画処理
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight - 5, paddleWidth, paddleHeight);
    ctx.fillStyle = "#00e676";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.hp > 0) {
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;
                
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                
                // 耐久力に応じて色を変化（通常は青、硬いものは数字に応じて色を濃く）
                if (b.maxHp === 1) {
                    ctx.fillStyle = "#2979ff";
                } else {
                    // 耐久回数が多いほどオレンジ〜紫色に近づく
                    ctx.fillStyle = `hsl(${20 + b.hp * 15}, 100%, 50%)`;
                }
                ctx.fill();
                ctx.closePath();

                // 2回以上のブロックには残り耐久回数を数字で表示
                if (b.maxHp > 1) {
                    ctx.font = "bold 10px sans-serif";
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "center";
                    ctx.fillText(b.hp, brickX + brickWidth / 2, brickY + 13);
                }
            }
        }
    }
}

// 罠（赤い玉）の移動と描画
function handleTraps() {
    for (let i = traps.length - 1; i >= 0; i--) {
        const t = traps[i];
        t.y += t.speed;

        // 描画
        ctx.beginPath();
        ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff1744"; // 不気味な赤
        ctx.fill();
        ctx.closePath();

        // パドル（ボード）との衝突判定
        if (t.y >= canvas.height - paddleHeight - 11 && t.y <= canvas.height) {
            if (t.x > paddleX && t.x < paddleX + paddleWidth) {
                gameState = 'GAMEOVER'; // 触れたら即ゲームオーバー
            }
        }

        // 画面外に落ちたら配列から削除
        if (t.y > canvas.height) {
            traps.splice(i, 1);
        }
    }
}

function drawUI() {
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE: ${score}`, 15, 20);
    ctx.fillText(`STAGE: ${stage}`, 110, 20);
    ctx.textAlign = "right";
    ctx.fillText(`HI-SCORE: ${highScore}`, canvas.width - 15, 20);
}

function drawOverlay(title, subtext, color) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(subtext, canvas.width / 2, canvas.height / 2 + 30);
}

// メインループ
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        drawBricks();
        drawBall();
        drawPaddle();
        handleTraps();
        drawUI();
        collisionDetection();

        // 壁判定
        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
        if (y + dy < ballRadius) dy = -dy;
        else if (y + dy > canvas.height - ballRadius - 5) {
            if (x > paddleX && x < paddleX + paddleWidth) {
                let hitPos = (x - paddleX) / paddleWidth;
                dx = (speed = Math.abs(dy)) * 2 * (hitPos - 0.5);
                dy = -dy;
            } else {
                gameState = 'GAMEOVER';
            }
        }

        // パドル移動
        if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 6;
        else if (leftPressed && paddleX > 0) paddleX -= 6;

        x += dx;
        y += dy;
    } 
    else if (gameState === 'START') {
        drawOverlay("INFINITY BREAKER", "画面をクリックしてスタート", "#0095DD");
    } 
    else if (gameState === 'GAMEOVER') {
        drawOverlay("GAME OVER", "クリックしてリトライ", "#ff1744");
        drawUI();
    }

    requestAnimationFrame(draw);
}

draw();
