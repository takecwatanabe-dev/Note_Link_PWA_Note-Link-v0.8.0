// js/app.js — V0.8.0-COMPAT-02C-FIX2
import { redraw } from './store.js';
import { createInk } from './ink.js';
import { createUI } from './ui.js';

const canvas = document.getElementById('stage');
const host = document.getElementById('canvasHost');
const ctx = canvas.getContext('2d');

resizeCanvas();
addEventListener('resize', resizeCanvas);

function resizeCanvas(){
  const dpr = Math.max(1, Math.min(2, devicePixelRatio||1));
  const rect = host.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  redraw(ctx);
}

const ink = createInk(ctx, host);
createUI(ctx, host, ink);

// 右クリックでハンドツール一時切替（押している間だけ）
let rightDown = false, prevTool = 'pen';
host.addEventListener('pointerdown', (e)=>{
  if(e.button === 2){ rightDown = true; prevTool = 'pen'; ink.setTool('hand'); }
});
addEventListener('pointerup', (e)=>{
  if(rightDown && e.button === 2){ rightDown = false; ink.setTool(prevTool); }
});
addEventListener('contextmenu', (e)=>{ if(e.target===host||e.target===canvas) e.preventDefault(); });
