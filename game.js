const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

let frames = 0;
let pipes = [];
let pipeGap = 200;
let pipeWidth = 80;
let pipeSpeed = 2.2;
let spawnInterval = 110; // frames

const shark = {
	x: 120,
	y: H/2,
	r: 20,
	vy: 0,
	gravity: 0.55,
	lift: -10,
	rotation: 0
};

let score = 0;
let running = true;
let best = parseInt(localStorage.getItem('bestShark') || '0', 10) || 0;

// background clouds and sea creatures
const clouds = [
	{x: 80, y: 80, size: 40, speed: 0.2},
	{x: 240, y: 120, size: 34, speed: 0.12},
	{x: 380, y: 50, size: 46, speed: 0.16},
	{x: 120, y: 40, size: 28, speed: 0.08}
];

const creatures = [];
function initCreatures(){
	const types = ['fish','jelly','turtle'];
	for(let i=0;i<6;i++){
		const t = types[i%types.length];
		creatures.push({
			type: t,
			x: Math.random()*W,
			y: H - 80 - Math.random()*120,
			size: 12 + Math.random()*28,
			speed: 0.2 + Math.random()*0.6
		});
	}
}
initCreatures();

function reset() {
	frames = 0;
	pipes = [];
	shark.y = H/2;
	shark.vy = 0;
	score = 0;
	running = true;
}

function spawnPipe() {
	const minTop = 60;
	const maxTop = H - pipeGap - 120;
	const top = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
	pipes.push({ x: W + 20, top: top, passed: false });
}

function update() {
	frames++;

	// physics
	shark.vy += shark.gravity;
	shark.y += shark.vy;
	shark.rotation = Math.max(-0.6, Math.min(1.2, shark.vy / 10));

	// spawn
	if (frames % spawnInterval === 0) spawnPipe();

	// pipes movement & scoring
	for (let i = pipes.length - 1; i >= 0; i--) {
		const p = pipes[i];
		p.x -= pipeSpeed;
		if (!p.passed && p.x + pipeWidth < shark.x) {
			p.passed = true;
			score++;
			if (score > best) { best = score; localStorage.setItem('bestShark', String(best)); }
		}
		if (p.x + pipeWidth < -50) pipes.splice(i, 1);
	}

	// collisions: ground/ceiling
	if (shark.y - shark.r < 0 || shark.y + shark.r > H) {
		running = false;
	}

	// collisions: pipes
	for (const p of pipes) {
		const inX = shark.x + shark.r > p.x && shark.x - shark.r < p.x + pipeWidth;
		if (inX) {
			if (shark.y - shark.r < p.top || shark.y + shark.r > p.top + pipeGap) {
				running = false;
			}
		}
	}
}

function drawBackground() {
	// sky gradient
	const g = ctx.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, '#9EE2FF');
	g.addColorStop(0.6, '#87CEEB');
	g.addColorStop(1, '#6FC0E8');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);

	// clouds
	ctx.fillStyle = 'rgba(255,255,255,0.85)';
	for (const c of clouds){
		drawCloud((c.x + frames*c.speed) % (W+200) - 100, c.y, c.size);
	}
}

function drawCloud(x,y,size){
	ctx.beginPath();
	ctx.arc(x, y, size*0.6, Math.PI*0.5, Math.PI*1.5);
	ctx.arc(x+size*0.6, y-size*0.2, size*0.8, Math.PI*1.0, Math.PI*1.85);
	ctx.arc(x+size*1.1, y, size*0.6, Math.PI*1.2, Math.PI*2.5);
	ctx.closePath();
	ctx.fill();
}

function drawPipes() {
	for (const p of pipes) {
		// coral tube gradient
		const gTop = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
		gTop.addColorStop(0, '#FF8C69');
		gTop.addColorStop(0.5, '#FF6F61');
		gTop.addColorStop(1, '#E85A4F');

		const gBottom = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
		gBottom.addColorStop(0, '#F59B7A');
		gBottom.addColorStop(0.5, '#F26A56');
		gBottom.addColorStop(1, '#D15242');

		// rounded coral tubes
		drawRoundedRect(p.x, 0, pipeWidth, p.top, 12, gTop);
		drawRoundedRect(p.x, p.top + pipeGap, pipeWidth, H - (p.top + pipeGap), 12, gBottom);

		// coral bumps / texture
		drawCoralBumps(p.x, 0, pipeWidth, p.top, true);
		drawCoralBumps(p.x, p.top + pipeGap, pipeWidth, H - (p.top + pipeGap), false);

		// small branching coral accents
		drawCoralBranch(p.x + pipeWidth - 8, p.top - 6, -1);
		drawCoralBranch(p.x + 8, p.top + pipeGap + 6, 1);
	}
}

function drawRoundedRect(x, y, w, h, r, fillStyle) {
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
	ctx.fillStyle = fillStyle;
	ctx.fill();
	ctx.restore();
}

function drawCoralBumps(x, y, w, h, top) {
	ctx.save();
	const count = Math.max(4, Math.floor(h / 28));
	for (let i = 0; i < count; i++) {
		const bx = x + (Math.random() * 0.6 + 0.2) * w;
		const by = y + (i + 0.5) * (h / count) + (Math.random() * 10 - 5);
		const br = 4 + Math.random() * 6;
		ctx.beginPath();
		ctx.fillStyle = 'rgba(255,255,255,0.12)';
		ctx.arc(bx, by, br, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.fillStyle = 'rgba(255,255,255,0.06)';
		ctx.arc(bx + 3, by - 2, br * 0.6, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
}

function drawCoralBranch(x, y, dir) {
	// dir: -1 for upward branch, 1 for downward branch
	ctx.save();
	ctx.strokeStyle = '#FFB09A';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(x, y);
	const len = 18 + Math.random() * 14;
	ctx.quadraticCurveTo(x + 6 * dir, y + len * 0.4 * dir, x + 12 * dir, y + len * dir);
	ctx.stroke();

	// small tips
	ctx.fillStyle = '#FF6F61';
	ctx.beginPath();
	ctx.arc(x + 12 * dir, y + len * dir, 4, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

function drawCreatures(){
	for(const cr of creatures){
		// move slowly
		cr.x -= cr.speed;
		if (cr.x < -60) cr.x = W + Math.random()*80;

		if (cr.type === 'fish') drawFish(cr.x, cr.y, cr.size);
		if (cr.type === 'jelly') drawJelly(cr.x, cr.y, cr.size);
		if (cr.type === 'turtle') drawTurtle(cr.x, cr.y, cr.size);
	}
}

function drawFish(x,y,s){
	ctx.save();
	ctx.translate(x,y);
	ctx.fillStyle = '#FF6F61';
	ctx.beginPath();
	ctx.ellipse(0,0,s*0.9,s*0.6,0,0,Math.PI*2);
	ctx.fill();
	ctx.fillStyle = '#e65550';
	ctx.beginPath();
	ctx.moveTo(-s*0.6,0);
	ctx.lineTo(-s, -s*0.4);
	ctx.lineTo(-s, s*0.4);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

function drawJelly(x,y,s){
	ctx.save();
	ctx.translate(x,y);
	ctx.fillStyle = 'rgba(150,100,255,0.8)';
	ctx.beginPath();
	ctx.arc(0,0,s*0.6,Math.PI,0);
	ctx.lineTo(s*0.6,s*0.6);
	ctx.quadraticCurveTo(0,s*0.9,-s*0.6,s*0.6);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

function drawTurtle(x,y,s){
	ctx.save();
	ctx.translate(x,y);
	ctx.fillStyle = '#7bbf6a';
	ctx.beginPath();
	ctx.ellipse(0,0,s*1.1,s*0.8,0,0,Math.PI*2);
	ctx.fill();
	ctx.restore();
}

function drawShark() {
	ctx.save();
	ctx.translate(shark.x, shark.y);
	ctx.rotate(shark.rotation);

	// body
	ctx.fillStyle = '#6e7f86';
	ctx.beginPath();
	ctx.ellipse(0, 0, shark.r*1.4, shark.r, 0, 0, Math.PI*2);
	ctx.fill();

	// tail
	ctx.beginPath();
	ctx.moveTo(-shark.r*1.4, 0);
	ctx.lineTo(-shark.r*2, -shark.r*0.8);
	ctx.lineTo(-shark.r*2, shark.r*0.8);
	ctx.closePath();
	ctx.fill();

	// fin
	ctx.fillStyle = '#54646a';
	ctx.beginPath();
	ctx.moveTo(shark.r*0.2, -shark.r*0.6);
	ctx.lineTo(shark.r*0.8, -shark.r*1.4);
	ctx.lineTo(shark.r*1.1, -shark.r*0.2);
	ctx.closePath();
	ctx.fill();

	// eye
	ctx.fillStyle = '#fff';
	ctx.beginPath();
	ctx.arc(shark.r*0.5, -shark.r*0.1, shark.r*0.22, 0, Math.PI*2);
	ctx.fill();
	ctx.fillStyle = '#000';
	ctx.beginPath();
	ctx.arc(shark.r*0.6, -shark.r*0.1, shark.r*0.09, 0, Math.PI*2);
	ctx.fill();

	// mouth (teeth)
	ctx.fillStyle = '#fff';
	ctx.beginPath();
	ctx.moveTo(shark.r*0.2, shark.r*0.6);
	ctx.lineTo(shark.r*1.1, shark.r*0.6);
	ctx.lineTo(shark.r*0.6, shark.r*0.9);
	ctx.closePath();
	ctx.fill();

	ctx.restore();
}

function drawHUD() {
	// top-left score and best
	ctx.save();
	ctx.fillStyle = 'rgba(0,0,0,0.35)';
	ctx.fillRect(12,12,150,56);
	ctx.fillStyle = '#fff';
	ctx.font = '22px Arial';
	ctx.textAlign = 'left';
	ctx.fillText('Score: ' + score, 20, 36);
	ctx.fillText('Best: ' + best, 20, 58);
	ctx.restore();

	if (!running) {
		ctx.fillStyle = 'rgba(0,0,0,0.45)';
		ctx.fillRect(0, H/2 - 60, W, 120);
		ctx.fillStyle = '#fff';
		ctx.font = '24px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('Game Over — Click or press Space to retry', W/2, H/2 - 10);
		ctx.fillText('Score: ' + score, W/2, H/2 + 30);
	}
}

function loop() {
	if (running) update();
	else frames++; // keep animations like clouds moving

	drawBackground();
	drawCreatures();
	drawPipes();
	drawShark();
	drawHUD();

	requestAnimationFrame(loop);
}

// controls
canvas.addEventListener('click', (e) => {
	if (!running) { reset(); return; }
	shark.vy = shark.lift;
});
document.addEventListener('keydown', (e) => {
	if (e.code === 'Space') {
		e.preventDefault();
		if (!running) { reset(); return; }
		shark.vy = shark.lift;
	}
});

// start
requestAnimationFrame(loop);