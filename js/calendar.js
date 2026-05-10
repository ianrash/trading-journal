// Calendar Functions

let calDate = new Date();

function renderCalendar(){
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  document.getElementById('cal-month-year').textContent = MONTHS_FULL[month] + ' ' + year;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  
  for(let i = 0; i < firstDay; i++){
    const empty = document.createElement('div');
    empty.className = 'cal-day cal-day-empty';
    grid.appendChild(empty);
  }
  
  for(let day = 1; day <= daysInMonth; day++){
    const cell = document.createElement('div');
    
    const dayTrades = state.trades.filter(t => {
      if(!t.date)return false;
      const parts = t.date.split(' ');
      if(parts.length === 2) {
        const monthNum = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11}[parts[0]];
        return parseInt(parts[1]) === day && monthNum === month;
      }
      return false;
    });
    
    const pnl = dayTrades.reduce((s,t) => s + t.pnl, 0);
    const hasTrade = dayTrades.length > 0;
    
    cell.className = 'cal-day';
    if(hasTrade){
      cell.className += pnl >= 0 ? ' cal-day-profit' : ' cal-day-loss';
    } else {
      cell.className += ' cal-day-noday';
    }
    
    const dayNum = document.createElement('div');
    dayNum.className = 'cal-day-num';
    dayNum.textContent = day;
    cell.appendChild(dayNum);
    
    if(hasTrade){
      const pnlDiv = document.createElement('div');
      pnlDiv.className = 'cal-day-pnl ' + (pnl >= 0 ? 'cal-day-pnlProfit' : 'cal-day-pnlLoss');
      pnlDiv.textContent = formatPnL(pnl);
      cell.appendChild(pnlDiv);
      
      const tradesDiv = document.createElement('div');
      tradesDiv.className = 'cal-day-trades';
      tradesDiv.textContent = dayTrades.length + ' trade' + (dayTrades.length > 1 ? 's' : '');
      cell.appendChild(tradesDiv);
    }
    
    cell.onclick = () => showCalDay(day);
    grid.appendChild(cell);
  }
}

function formatPnL(value){
  const abs = Math.abs(value);
  if(abs >= 1000){
    return (value < 0 ? '-' : '') + '$' + (abs / 1000).toFixed(2) + 'K';
  }
  return (value < 0 ? '-' : '') + '$' + abs.toFixed(0);
}

function calPrev(){
  calDate.setMonth(calDate.getMonth() - 1);
  renderCalendar();
}

function calNext(){
  calDate.setMonth(calDate.getMonth() + 1);
  renderCalendar();
}

function showCalDay(day){
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  
  const dayTrades = state.trades.filter(t => {
    const parts = t.date.split(' ');
    if(parts.length === 2) {
      const monthNum = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11}[parts[0]];
      return parseInt(parts[1]) === day && monthNum === month;
    }
    return false;
  });
  
  if(dayTrades.length){
    const pnl = dayTrades.reduce((s,t) => s + t.pnl, 0);
    document.getElementById('cal-details-title').textContent = MONTHS_FULL[month] + ' ' + day + ', ' + year;
    document.getElementById('cal-details-sub').textContent = dayTrades.length + ' trade' + (dayTrades.length > 1 ? 's' : '') + ' · ' + formatPnL(pnl);
    
    const body = document.getElementById('cal-details-body');
    body.innerHTML = dayTrades.map(t => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${t.dir==='BUY'?'var(--green-lo)':'var(--red-lo)'};border:1px solid ${t.dir==='BUY'?'rgba(0,190,116,0.3)':'rgba(255,51,102,0.3)'};">
              ${t.dir==='BUY'?'▲':'▼'}
            </div>
            <div>
              <div style="font-family:'DM Mono',monospace;font-size:16px;font-weight:700;">${t.pair}</div>
              <div style="font-size:11px;color:var(--muted);">${t.setup} · ${t.session}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:${t.pnl>=0?'var(--green)':'var(--red)'};">${formatPnL(t.pnl)}</div>
            <span class="badge badge-${t.outcome==='WIN'?'win':t.outcome==='LOSS'?'loss':'amber'}">${t.outcome}</span>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;padding:10px;background:var(--card);border-radius:6px;">
          <div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">Entry</div><div class="mono" style="font-size:13px;">${t.entry}</div></div>
          <div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">Stop Loss</div><div class="mono" style="font-size:13px;">${t.sl}</div></div>
          <div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">Take Profit</div><div class="mono" style="font-size:13px;">${t.tp}</div></div>
        </div>
        
        <div style="display:flex;gap:12px;margin-bottom:12px;">
          <div style="flex:1;padding:8px;background:var(--card);border-radius:6px;">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Risk / R Multiple</div>
            <div class="mono" style="font-size:14px;color:${t.r>=0?'var(--green)':'var(--red)'};">${t.r >= 0 ? '+' : ''}${t.r.toFixed(1)}R</div>
          </div>
          <div style="flex:1;padding:8px;background:var(--card);border-radius:6px;">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Risk %</div>
            <div class="mono" style="font-size:14px;">${t.riskPct}%</div>
          </div>
        </div>
        
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;">Emotion:</div>
          <span class="badge" style="background:var(--accent-lo);color:var(--accent);">${t.emotion} ${EMOJIS[t.emotion]||''}</span>
          <div style="margin-left:auto;display:flex;align-items:center;gap:4px;">
            <span style="font-size:9px;color:var(--muted);text-transform:uppercase;">Rating:</span>
            <span style="color:var(--amber);">${'★'.repeat(t.rating)}</span>
          </div>
        </div>
        
        ${t.notes ? `<div style="background:var(--card);border-radius:6px;padding:10px;margin-bottom:12px;">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Notes</div>
          <div style="font-size:12px;color:var(--text);line-height:1.5;">${t.notes}</div>
        </div>` : ''}
        
        ${(t.screenshots?.htf || t.screenshots?.mtf || t.screenshots?.ltf) ? `
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:6px;">Screenshots</div>
        <div style="display:flex;gap:8px;">
          ${t.screenshots.htf ? `<div style="width:60px;height:40px;background:var(--card);border-radius:4px;overflow:hidden;"><img src="${t.screenshots.htf}" style="width:100%;height:100%;object-fit:cover;"/></div>` : ''}
          ${t.screenshots.mtf ? `<div style="width:60px;height:40px;background:var(--card);border-radius:4px;overflow:hidden;"><img src="${t.screenshots.mtf}" style="width:100%;height:100%;object-fit:cover;"/></div>` : ''}
          ${t.screenshots.ltf ? `<div style="width:60px;height:40px;background:var(--card);border-radius:4px;overflow:hidden;"><img src="${t.screenshots.ltf}" style="width:100%;height:100%;object-fit:cover;"/></div>` : ''}
        </div>
        ` : ''}
      </div>
    `).join('');
    
    document.getElementById('cal-details-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    alert('No trades on ' + MONTHS_FULL[month] + ' ' + day);
  }
}

function closeCalDetails(){
  document.getElementById('cal-details-modal').classList.remove('open');
  document.body.style.overflow = '';
}