const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

const holdCanvas = document.getElementById('hold');
const holdCtx = holdCanvas.getContext('2d');

context.scale(20, 20);
nextCtx.scale(60, 30);
holdCtx.scale(60, 30);

// Variables
var matrixConnector;
var matrixHold;
var matrixHoldSwitcher;

// Tetris Code
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length -1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
		player.lines += 1;
		
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10 * player.level;
        rowCount *= 2;
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type)
{
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0}, context);
    drawMatrix(player.matrix, player.pos, context);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
		updateAll();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = matrixConnector;
	if (!player.matrix) player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);

   // Create new next block
	nextReset();
	
	// Check gameover
    if (collide(arena, player)) {
		document.getElementById('pausetext').innerText = "GAME OVER"; 
		player.paused = true;
		player.needReset = true
		matrixHold = null;
		holdDraw();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;
function update(time = 0) {
    const deltaTime = time - lastTime + player.level*5;

	if (!player.paused) {
		dropCounter += deltaTime;
    }
	if (dropCounter > dropInterval) {
        playerDrop();
    }
	
    lastTime = time;

    draw();
	nextDraw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = "Score: " + player.score;
}

function updateLines() {
	document.getElementById('lines').innerText = "Lines: " + player.lines;
}

function updateLevel() {
	
	player.level = Math.round(player.lines/10) + 1;
	
	document.getElementById('level').innerText = "Level: " + player.level;
}

function updateAll() {
	updateScore();
	updateLines();
	updateLevel();
}

function gamePause() { 
	if (player.paused) {
		if (player.needReset) {
			player.needReset = false;
			arena.forEach(row => row.fill(0));
			player.score = 0;
			player.lines = 0;
			updateAll();
		}
		else {
			player.paused = false;
			document.getElementById('pausetext').innerText = " "; 
		}
	}
	else if (!player.paused) {
	player.paused = true;
	document.getElementById('pausetext').innerText = "PAUSED"; 
	}
}

document.addEventListener('keydown', event => {
	if (!player.paused) {
		//Left (Arrow Left)
		if (event.keyCode === 37) {
			playerMove(-1);
		//Right (Arrow Right)
		} else if (event.keyCode === 39) {
			playerMove(1);
		//Down (Arrow Down)
		} else if (event.keyCode === 40) {
			playerDrop();
			
			player.score++;
		//Rotate Right (Arrow Up & D)
		} else if (event.keyCode === 38) {
			playerRotate(1);
		} else if (event.keyCode === 68) {
			playerRotate(1);
		//Rotate Left (A)
		} else if (event.keyCode === 65) {
			playerRotate(-1);
		} else if (event.keyCode === 16) {
			holdPiece();
		}
	}
	//Pause (Space)
	if (event.keyCode == 32) {
			gamePause();
		}
});

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
	lines: 0,
	level: 0,
	paused: true,
	needReset: false,
};

// Next Code
const nextBox = createMatrix(6, 6);

const next = {
	pos: {x: 0, y:0},
	matrix: null,
};

function nextDraw() {
	nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, canvas.width, canvas.height);
	
	drawMatrix(nextBox, {x: 0, y: 0}, nextCtx);
    drawMatrix(next.matrix, next.pos, nextCtx);
}

function nextReset() {
	const pieces = 'TJLOSZI';
    next.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
	matrixConnector = next.matrix;
    next.pos.y = 1;
    next.pos.x = 1;
}

// Hold Code
const holdBox = createMatrix(6, 6);

function holdDraw() {
	holdCtx.fillStyle = '#000';
    holdCtx.fillRect(0, 0, canvas.width, canvas.height);
	
	drawMatrix(holdBox, {x: 0, y: 0}, holdCtx);
    if (matrixHold) drawMatrix(matrixHold, {x: 1, y: 1}, holdCtx);
}

function holdPiece() {
	if (!matrixHold || !matrixHoldSwitcher) {
		matrixHoldSwitcher = player.matrix;
		matrixHold = matrixHoldSwitcher;
		
		playerReset();
	} 
	else {
	matrixHoldSwitcher = player.matrix;
	player.matrix = matrixHold;
	matrixHold = matrixHoldSwitcher;
	
	player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);

	}
	holdDraw();
}

window.onblur = function() {
	if (!player.paused) gamePause();
}

// After Initialization
playerReset();
updateAll();
update();

nextReset();
nextDraw();

holdDraw();