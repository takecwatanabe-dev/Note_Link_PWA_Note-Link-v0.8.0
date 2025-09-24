// V0.8.0-COMPAT-02C-FIX2
export const store = {
  strokes: [], // { points:[{x,y,p,tx,ty}], color, sizePx, tool }
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export function addStroke(stroke){ store.strokes.push(stroke); }
export function clearAll(){ store.strokes.length = 0; }

export function redraw(ctx){
  ctx.save();
  ctx.setTransform(store.scale, 0, 0, store.scale, store.offsetX, store.offsetY);
  ctx.clearRect((-store.offsetX)/store.scale, (-store.offsetY)/store.scale, ctx.canvas.width/store.scale, ctx.canvas.height/store.scale);
  for(const s of store.strokes){
    if(s.tool === 'eraser') continue; // 消しゴムはストローク化しない
    drawStroke(ctx, s);
  }
  ctx.restore();
}

function drawStroke(ctx, s){
  if(s.points.length < 1) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = s.color || '#e6e9ef';
  ctx.beginPath();
  for(let i=1;i<s.points.length;i++){
    const a = s.points[i-1], b = s.points[i];
    const w = (s.sizePx * (1 + (b.p??1)*0.6)); // 圧力で太さ変化
    ctx.lineWidth = w;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
}
