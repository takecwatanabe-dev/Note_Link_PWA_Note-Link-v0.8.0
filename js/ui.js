// V0.8.0-COMPAT-02C-FIX2
import { store, clearAll, redraw } from './store.js';

export function createUI(ctx, host, ink){
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // HUD
  const hudTool = $('#hudTool');
  const hudSize = $('#hudSize');
  const hudPressure = $('#hudPressure');
  const hudTilt = $('#hudTilt');
  const hudScale = $('#hudScale');

  function mmToPx(mm){ return mm * (96/25.4); }
  function pxToPt(px){ return px * 72/96; }

  // ツール切替
  $$('#toolbar .tb-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('#toolbar .tb-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');

      const tool = btn.dataset.tool;
      if(tool){
        ink.setTool(tool);
        if(hudTool) hudTool.textContent = `Tool: ${tool[0].toUpperCase()+tool.slice(1)}`;
        if(tool==='keyboard') openDialog('#dlgKeyboard');
        if(tool==='gear') openDialog('#dlgGear');
      }
      const action = btn.dataset.action;
      if(action==='clearAll'){
        if(confirm('全ての描画を消去します。よろしいですか？')){
          clearAll(); redraw(ctx);
        }
      }
    }, { passive: true });
  });
  const defaultBtn = document.querySelector('[data-tool="pen"]');
  if(defaultBtn) defaultBtn.classList.add('active');

  // 設定（太さ/単位併記）
  const penSize = $('#penSize');
  const unitMM = $('#unitMM');
  const unitPX = $('#unitPX');
  const unitPT = $('#unitPT');
  const showLive = $('#showLive');

  function updateUnits(){
    if(!penSize) return;
    const mm = Number(penSize.value);
    const px = mmToPx(mm);
    const pt = pxToPt(px);
    if(unitMM) unitMM.textContent = `${mm.toFixed(1)} mm`;
    if(unitPX) unitPX.textContent = `${px.toFixed(1)} px`;
    if(unitPT) unitPT.textContent = `${pt.toFixed(1)} pt`;
    if(hudSize) hudSize.textContent = `Size: ${mm.toFixed(1)} mm (${px.toFixed(1)} px / ${pt.toFixed(1)} pt)`;
    ink.setSizeMm(mm);
  }
  if(penSize){ penSize.addEventListener('input', updateUnits, { passive:true }); updateUnits(); }
  if(showLive){ showLive.addEventListener('change', ()=>{ ink.setShowLive(showLive.checked); }, { passive:true }); }

  // HUD ライブ
  ink.onLive(({p,tx,ty})=>{
    if(hudPressure) hudPressure.textContent = `Pressure: ${p.toFixed(2)}`;
    if(hudTilt) hudTilt.textContent = `Tilt: ${tx|0}/${ty|0}`;
    if(hudScale) hudScale.textContent = `Scale: ${(store.scale*100)|0}%`;
  });

  // ダイアログ共通
  function bindDialog(dlg){
    if(!dlg) return;
    dlg.querySelectorAll('[data-close]').forEach(x=> x.addEventListener('click', ()=> dlg.close()));
    dlg.addEventListener('cancel', (e)=>{ e.preventDefault(); dlg.close(); });
    dlg.addEventListener('click', (e)=>{ if(e.target === dlg) dlg.close(); });
  }
  function openDialog(sel){
    const dlg = $(sel);
    if(!dlg) return;
    if(typeof dlg.showModal === 'function') dlg.showModal();
    bindDialog(dlg);
  }

  // ズーム量表示の補助
  const obs = new ResizeObserver(()=>{ if(hudScale) hudScale.textContent = `Scale: ${(store.scale*100)|0}%`; });
  obs.observe(host);
}
