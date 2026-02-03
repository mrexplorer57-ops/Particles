const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("video");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const cx = () => canvas.width / 2;
const cy = () => canvas.height / 2;

let particles = [];
let textTargets = [];
let lastTriggerTime = 0;
let mode = "planet"; // "planet" or "text"

// ---------------- PARTICLE CLASS ----------------
class Particle {
  constructor(angle, radius) {
    this.angle = angle;
    this.radius = radius;
    this.x = cx() + Math.cos(angle) * radius;
    this.y = cy() + Math.sin(angle) * radius;
    this.tx = this.x;
    this.ty = this.y;
  }

  update() {
    if(mode === "planet") {
      this.angle += 0.004;
      this.x = cx() + Math.cos(this.angle) * this.radius;
      this.y = cy() + Math.sin(this.angle) * this.radius;
    } else {
      this.x += (this.tx - this.x) * 0.08;
      this.y += (this.ty - this.y) * 0.08;
    }
  }

  draw() {
    ctx.fillStyle = "#9be7ff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI*2);
    ctx.fill();
  }
}

// ---------------- INIT PARTICLES ----------------
function initPlanet() {
  particles = [];
  const R = 120;
  for(let i=0;i<700;i++){
    const a = Math.random()*Math.PI*2;
    const r = R + Math.random()*25;
    particles.push(new Particle(a,r));
  }
}
initPlanet();

// ---------------- CREATE TEXT TARGETS ----------------
function createTextTargets(text){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText(text, cx(), cy());

  const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
  textTargets = [];
  for(let y=0;y<canvas.height;y+=6){
    for(let x=0;x<canvas.width;x+=6){
      const idx = (y*canvas.width + x)*4+3;
      if(data[idx]>150){
        textTargets.push({x,y});
      }
    }
  }

  particles.forEach((p,i)=>{
    const t = textTargets[i%textTargets.length];
    p.tx = t.x;
    p.ty = t.y;
  });

  mode = "text";
  setTimeout(()=>{ mode="planet"; initPlanet(); }, 2600);
}

// ---------------- DETECT GESTURE ----------------
function detectGesture(lm){
  const iUp = lm[8].y < lm[6].y - 0.03;
  const mUp = lm[12].y < lm[10].y - 0.03;
  const rUp = lm[16].y < lm[14].y - 0.03;

  if(iUp && mUp && !rUp) return "v";
  if(iUp && mUp && rUp) return "open";
  if(!iUp && !mUp && !rUp) return "fist";
  return "";
}

// ---------------- MEDIAPIPE HANDS ----------------
const hands = new Hands({locateFile: f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
hands.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:0.6,minTrackingConfidence:0.6});

hands.onResults(res=>{
  if(!res.multiHandLandmarks.length) return;
  const g = detectGesture(res.multiHandLandmarks[0]);
  const now = Date.now();
  if(g && now - lastTriggerTime > 1500){
    lastTriggerTime = now;
    if(g==="v") createTextTargets("You’re kinda special ✨");
    if(g==="open") createTextTargets("Hey… smile 😊");
    if(g==="fist") createTextTargets("This is for you ❤️");
  }
});

const cameraMP = new Camera(video,{onFrame: async()=>await hands.send({image:video}),width:640,height:480});
cameraMP.start();

// ---------------- ANIMATION LOOP ----------------
function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Planet Glow
  const g = ctx.createRadialGradient(cx(),cy(),40,cx(),cy(),160);
  g.addColorStop(0,"rgba(100,200,255,0.3)");
  g.addColorStop(1,"transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx(),cy(),160,0,Math.PI*2);
  ctx.fill();

  particles.forEach(p=>{
    p.update();
    p.draw();
  });

  requestAnimationFrame(animate);
}
animate();
