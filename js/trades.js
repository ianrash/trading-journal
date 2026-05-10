// Trade Log Functions

function _escapeHtml(str){
  if(!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function buildSetupFilters(){
  const el=document.getElementById('setup-filters');
  el.innerHTML='<button class="filter-btn active_setup" onclick="setFilter(\'setup\',\'ALL\',this)" data-setup="ALL">ALL SETUPS</button>';
  SETUPS.forEach(s=>{
    el.innerHTML+=`<button class="filter-btn" onclick="setFilter('setup','${s}',this)" data-setup="${s}">${s}</button>`;
  });
}

const debouncedRenderTradeLog = debounce(() => renderTradeLog(), 300);

function setFilter(type,val,btn){
  state.tradeFilter[type]=val;
  if(type==='outcome'){
    document.querySelectorAll('#outcome-filters .filter-btn').forEach(b=>b.className='filter-btn');
    btn.className=val==='ALL'?'filter-btn active_all':val==='WIN'?'filter-btn active_win':val==='LOSS'?'filter-btn active_loss':'filter-btn active_setup';
  } else {
    document.querySelectorAll('#setup-filters .filter-btn').forEach(b=>b.className='filter-btn');
    btn.className='filter-btn active_setup';
  }
  renderTradeLog();
}

function renderTradeLog(){
  const q=(document.getElementById('trade-search')||{}).value?.toLowerCase()||'';
  const {outcome,setup}=state.tradeFilter;
  const filtered=state.trades.filter(t=>{
    const matchO=outcome==='ALL'||t.outcome===outcome;
    const matchS=setup==='ALL'||t.setup===setup;
    const matchQ=!q||(t.pair && t.pair.toLowerCase().includes(q))||(t.setup && t.setup.toLowerCase().includes(q))||(t.notes && t.notes.toLowerCase().includes(q));
    return matchO&&matchS&&matchQ;
  });
  document.getElementById('trade-count-label').textContent=filtered.length+' of '+state.trades.length+' trades';
  const el=document.getElementById('trade-list');
  let html='';
  filtered.forEach(t=>{
    const ssCount=[t.screenshots?.htf,t.screenshots?.mtf,t.screenshots?.ltf].filter(Boolean).length;
    html+=`
    <div class="trade-row" id="trow-${t.id}">
      <div class="trade-row-header" onclick="toggleTrade(${t.id})">
        <div class="trade-dir-icon ${t.dir==='BUY'?'trade-dir-buy':'trade-dir-sell'}" style="color:${t.dir==='BUY'?'var(--green)':'var(--red)'};">
          ${t.dir==='BUY'?'▲':'▼'}
        </div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span class="trade-pair">${_escapeHtml(t.pair)}</span>
            <span class="badge badge-accent">${_escapeHtml(t.setup)}</span>
            ${t.tags&&t.tags.length?`<span style="display:flex;gap:3px;">${t.tags.map(tag=>`<span class="trade-tag trade-tag-${tag.replace(' ','')}">${tag}</span>`).join('')}</span>`:''}
            ${ssCount>0?`<span class="badge badge-muted">📸${ssCount}</span>`:''}
          </div>
          <div class="trade-meta">${t.session} · ${t.date} · ${EMOJIS[t.emotion]||''}</div>
        </div>
        <div style="text-align:right;margin-right:8px;">
          <div class="trade-pnl" style="color:${t.pnl>=0?'var(--green)':'var(--red)'};">${fP(t.pnl)}</div>
          <div class="trade-r" style="color:${t.r>=0?'var(--green)':'var(--red)'};">${fR(t.r)}</div>
        </div>
        <span class="badge badge-${t.outcome==='WIN'?'win':t.outcome==='LOSS'?'loss':'amber'}">${t.outcome}</span>
      </div>
      <div class="trade-detail">
        <div class="detail-grid">
          <div><div class="detail-label">Entry</div><div class="detail-val">${t.entry}</div></div>
          <div><div class="detail-label">Stop Loss</div><div class="detail-val">${t.sl}</div></div>
          <div><div class="detail-label">Take Profit</div><div class="detail-val">${t.tp}</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div>${'★'.repeat(t.rating)}<span style="color:var(--border);">${'★'.repeat(5-t.rating)}</span></div>
          <span style="font-size:11px;color:var(--muted);">${t.emotion} ${EMOJIS[t.emotion]||''}</span>
        </div>
        ${t.notes?`<div style="font-size:12px;color:var(--muted);font-style:italic;line-height:1.5;margin-bottom:8px;">"${_escapeHtml(t.notes)}"</div>`:''}
        ${ssCount>0?`
        <div style="font-size:10px;color:var(--muted);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px;">Screenshots</div>
        <div style="display:flex;gap:8px;">
          ${t.screenshots?.htf?`<div><div class="screenshot-thumb"><img src="${t.screenshots.htf}" alt="HTF"/></div><div class="screenshot-label">HTF</div></div>`:''}
          ${t.screenshots?.mtf?`<div><div class="screenshot-thumb"><img src="${t.screenshots.mtf}" alt="MTF"/></div><div class="screenshot-label">MTF</div></div>`:''}
          ${t.screenshots?.ltf?`<div><div class="screenshot-thumb"><img src="${t.screenshots.ltf}" alt="LTF"/></div><div class="screenshot-label">LTF</div></div>`:''}
        </div>`:''}
      </div>
    </div>`;
  });
  el.innerHTML=html;
}

function toggleTrade(id){
  const row=document.getElementById('trow-'+id);
  if(row) row.classList.toggle('expanded');
}