// V0.8.0-COMPAT-02C-FIX2
import { store, addStroke, redraw } from './store.js';

export function createInk(ctx, host){
  let drawing = false;
  let current = null;
  let activePointerId = null;
  let ignoreTouches = false; // ペン優先

  const state = {
    tool: 'pen',
    color: '#e6e9ef',
    sizeMm: 2.0,
    sizePx: mmToPx(2.0),
    showLive: true,
    onLive: (live)=>{},
  };

  function setTool(t){ state.tool = t; }
  function setSizeMm(mm){ state.sizeMm = mm; state.sizePx = mmToPx(mm); }
  function setShowLive(v){ state.showLive = v; }
  function onLive(fn){ state.onLive = fn; }

  host.addEventListener('pointerdown', (e)=>{
    const isPen = e.pointerType === 'pen';
    const isTouch = e.pointerType === 'touch';

    if(isPen){ ignoreTouches = true; activePointerId = e.pointerId; host.setPointerCapture(e.pointerId); }
    if(isTouch && (ignoreTouches || state.tool==='pen')) return;

    if(state.tool === 'hand'){
      drawing = true; activePointerId = e.pointerId; host.setPointerCapture(e.pointerId);
      host.dataset.panX0 = e.clientX; host.dataset.panY0 = e.clientY; host.dataset.offX0 = store.offsetX; host.dataset.offY0 = store.offsetY;
      return;
    }
    if(state.tool === 'eraser'){
      drawing = true; activePointerId = e.pointerId; host.setPointerCapture(e.pointerId);
      eraseAt(e);
      return;
    }

    drawing = true;
    current = { tool:'pen', color: state.color, sizePx: state.sizePx, points: [] };
    addPoint(current, e, host);
    addStroke(current);
  });

  host.addEventListener('pointermove', (e)=>{
    if(state.showLive) state.onLive({ p:e.pressure||0, tx:e.tiltX||0, ty:e.tiltY||0 });
    if(!drawing || e.pointerId !== activePointerId) return;

    if(state.tool === 'hand'){
      const dx = e.clientX - Number(host.dataset.panX0);
      const dy = e.clientY - Number(host.dataset.panY0);
      store.offsetX = Number(host.dataset.offX0) + dx;
      store.offsetY = Number(host.dataset.offY0) + dy;
      redraw(ctx);
      return;
    }
    if(state.tool === 'eraser'){
      eraseAt(e);
      return;
    }
    addPoint(current, e, host);
    redraw(ctx);
  });

  host.addEventListener('pointerup', (e)=>{
    if(e.pointerId !== activePointerId) return;
    drawing = false; activePointerId = null; current = null;
    setTimeout(()=>{ ignoreTouches = false; }, 120);
  });

  host.addEventListener('pointercancel', ()=>{
    drawing = false; activePointerId = null; current = null; ignoreTouches = false;
  });

  // ホイールで拡大縮小
  host.addEventListener('wheel', (e)=>{
    e.preventDefault();
    const scaleBefore = store.scale;
    const delta = Math.sign(e.deltaY) * -0.07;
    const next = clamp(store.scale * (1+delta), 0.25, 4);
    const rect = host.getBoundingClientRect();
    const cx = e.clientX - rect.left - store.offsetX;
    const cy = e.clientY - rect.top - store.offsetY;
    store.offsetX -= cx*(next/scaleBefore - 1);
    store.offsetY -= cy*(next/scaleBefore - 1);
    store.scale = next;
    redraw(ctx);
  }, { passive:false });

  function addPoint(stk, e, host){
    const rect = host.getBoundingClientRect();
    const x = (e.clientX - rect.left - store.offsetX) / store.scale;
    const y = (e.clientY - rect.top - store.offsetY) / store.scale;
    stk.points.push({ x, y, p: e.pressure||0, tx: e.tiltX||0, ty: e.tiltY||0 });
  }
  function eraseAt(e){
    const rect = host.getBoundingClientRect();
    const x = (e.clientX - rect.left - store.offsetX) / store.scale;
    const y = (e.clientY - rect.top - store.offsetY) / store.scale;
    const r = 10 / store.scale;
    store.strokes = store.strokes.filter(stk => !hitStroke(stk, x, y, r));
    redraw(ctx);
  }

  return { setTool, setSizeMm, setShowLive, onLive };
}

function mmToPx(mm){ return mm * (96/25.4); }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function hitStroke(stk, x, y, r){
  if(stk.tool !== 'pen') return false;
  const r2 = r*r;
  for(let i=1;i<stk.points.length;i++){
    const a = stk.points[i-1], b = stk.points[i];
    const d2 = segDist2(a.x,a.y,b.x,b.y,x,y);
    if(d2 <= r2) return true;
  }
  return false;
}
function segDist2(x1,y1,x2,y2,px,py){
  const vx = x2-x1, vy=y2-y1;
  const wx=px-x1, wy=py-y1;
  const c1 = vx*wx + vy*wy;
  if(c1<=0) return (px-x1)**2 + (py-y1)**2;
  const c2 = vx*vx + vy*vy;
  if(c2<=c1) return (px-x2)**2 + (py-y2)**2;
  const t = c1/c2;
  const sx = x1 + t*vx, sy = y1 + t*vy;
  return (px-sx)**2 + (py-sy)**2;
}
