// Dashboard Rendering

function _escapeHtml(str){
  if(!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function renderDashboard(){
  renderEquityChart();
  renderTeethChart();
  renderRecentTrades();
  renderSessionGrid();
}

function renderEquityChart(){
  if(!state.trades || !state.trades.length) return;
  const dates=[...new Set(state.trades.map(t=>t.date))].sort();
  let bal = state.startingBalance || 0;
  const labels=[], data=[];
  dates.forEach(d=>{
    const dayPnl=state.trades.filter(t=>t.date===d).reduce((s,t)=>s+t.pnl,0);
    bal+=dayPnl;
    const monthName = new Date(d.replace(/(\w+)\s(\d+)/,'$2 $1 2026')).toLocaleString('en-US',{month:'short'});
    labels.push(d.replace(/^\w+\s/,''));
    data.push(parseFloat(bal.toFixed(0)));
  });
  const ctx=document.getElementById('equity-chart').getContext('2d');
  if(state.chartInstances.equity){state.chartInstances.equity.destroy();}
  state.chartInstances.equity=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{data,borderColor:'#7968F2',borderWidth:2,fill:true,
      backgroundColor:(ctx2=>{const g=ctx2.chart.ctx.createLinearGradient(0,0,0,160);g.addColorStop(0,'rgba(121,104,242,0.25)');g.addColorStop(1,'rgba(121,104,242,0)');return g;}),
      tension:0.4,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:'#7968F2'}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},
      tooltip:{backgroundColor:'#111122',borderColor:'#191932',borderWidth:1,titleColor:'#555572',bodyColor:'#E0E0EF',
        callbacks:{label:ctx2=>'$'+ctx2.raw.toLocaleString()}}},
      scales:{x:{grid:{display:false},ticks:{color:'#555572',font:{size:10}}},
        y:{grid:{color:'#191932'},ticks:{color:'#555572',font:{size:10,family:'DM Mono'},callback:v=>'$'+v.toLocaleString()}}}}
  });
}

function renderTeethChart(){
  if(!state.trades || !state.trades.length) return;
  const dates=[...new Set(state.trades.map(t=>t.date))].sort().slice(-14);
  const el=document.getElementById('teeth-chart');
  el.innerHTML='';
  let total=0;
  const maxAbs = dates.length > 0 ? Math.max(...dates.map(dd=>Math.abs(state.trades.filter(t=>t.date===dd).reduce((s,t)=>s+(t.pnl||0),0))),1) : 1;
  dates.forEach(d=>{
    const dayPnl=state.trades.filter(t=>t.date===d).reduce((s,t)=>s+(t.pnl||0),0);
    total+=dayPnl;
    const h=Math.max(4,(Math.abs(dayPnl)/maxAbs)*44);
    const tooth=document.createElement('div');
    tooth.className='tooth '+(dayPnl>=0?'tooth-win':'tooth-loss');
    tooth.style.height=h+'px';
    tooth.title=(dayPnl>=0?'+':'')+dayPnl.toFixed(0)+' on '+d;
    el.appendChild(tooth);
  });
  document.getElementById('teeth-total').textContent=fP(total);
  document.getElementById('teeth-total').style.color=total>=0?'var(--green)':'var(--red)';
}

function renderRecentTrades(){
  const el=document.getElementById('recent-trades-list');
  el.innerHTML='';
  state.trades.slice(0,5).forEach(t=>{
    el.innerHTML+=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;margin-bottom:6px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${t.dir==='BUY'?'var(--green-lo)':'var(--red-lo)'};border:1px solid ${t.dir==='BUY'?'rgba(0,190,116,0.3)':'rgba(255,51,102,0.3)'};">
          ${t.dir==='BUY'?'▲':'▼'}
        </div>
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;">${_escapeHtml(t.pair)}</div>
          <div style="font-size:10px;color:var(--muted);">${t.dir} · ${_escapeHtml(t.session)} · ${_escapeHtml(t.setup)}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="text-align:right;">
          <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:${t.pnl>=0?'var(--green)':'var(--red)'};">${fP(t.pnl)}</div>
          <div style="font-size:10px;font-family:'DM Mono',monospace;color:${t.r>=0?'var(--green)':'var(--red)'};">${fR(t.r)}</div>
        </div>
        <span class="badge badge-${t.outcome==='WIN'?'win':t.outcome==='LOSS'?'loss':'amber'}">${t.outcome}</span>
      </div>
    </div>`;
  });
}

function renderSessionGrid(){
  const el=document.getElementById('session-grid');
  el.innerHTML='';
  SESSIONS.forEach(s=>{
    const ts=state.trades.filter(t=>t.session===s);
    const ws=ts.filter(t=>t.outcome==='WIN');
    const wr=ts.length?Math.round(ws.length/ts.length*100):0;
    const col=wr>=65?'var(--green)':wr>=50?'var(--amber)':'var(--red)';
    el.innerHTML+=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
      <div style="font-size:9px;color:var(--muted);margin-bottom:4px;">${s}</div>
      <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:${col};">${ts.length?wr+'%':'—'}</div>
      <div style="font-size:9px;color:var(--muted);">${ts.length} trades</div>
    </div>`;
  });
}