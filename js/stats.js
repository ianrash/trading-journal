// Global Stats & Render All

function renderAll(){
  updateGlobalStats();
  updateTradesPageStats();
  renderDashboard();
  renderTradeLog();
  renderJournalPage();
  renderPsychologyPage();
  renderPlanPage();
  buildSetupFilters();
  buildEmotionGrids();
}

function updateGlobalStats(){
  const pnl=totalPnl(), wr=winRate(), ar=avgR(), es=edgeScore(), ds=disciplineScore();
  const bal = (state.startingBalance || 0) + pnl;
  const dispBal = bal > 0 ? '$'+bal.toLocaleString('en',{minimumFractionDigits:0}) : '$0';
  document.getElementById('sb-balance').textContent = dispBal;
  document.getElementById('sb-pnl').textContent=fP(pnl)+' all time';
  const streak = calculateJournalStreak();
  document.getElementById('streak-count').textContent = streak > 0 ? streak : '0';
  document.getElementById('edge-score-chip').textContent = state.trades.length > 0 ? es : '--';
  document.getElementById('dash-balance').textContent='$'+bal.toLocaleString('en',{minimumFractionDigits:2});
  document.getElementById('dash-pnl-display').textContent=fP(pnl);
  document.getElementById('dash-pnl-display').style.color=pnl>=0?'var(--green)':'var(--red)';
  const pct = (state.startingBalance || 10000) > 0 ? ((pnl/(state.startingBalance || 10000))*100).toFixed(1) : '0.0';
  document.getElementById('dash-pnl-pct').textContent=(pnl>=0?'+':'')+pct+'%';
  document.getElementById('dash-pnl-pct').className='badge '+(pnl>=0?'badge-green':'badge-loss');
  document.getElementById('dash-streak').textContent = streak > 0 ? streak + '-day streak' : '--';
  document.getElementById('dash-edge-score').textContent = state.trades.length > 0 ? es : '--';
  document.getElementById('stat-winrate').textContent=wr.toFixed(1)+'%';
  document.getElementById('stat-winrate').style.color=wr>=60?'var(--green)':wr>=50?'var(--amber)':'var(--red)';
  document.getElementById('stat-wl').textContent=wins().length+'W / '+losses().length+'L';
  document.getElementById('stat-avgr').textContent=(ar>=0?'+':'')+ar.toFixed(2)+'R';
  document.getElementById('stat-avgr').style.color=ar>0?'var(--green)':'var(--red)';
  document.getElementById('stat-exp').textContent=(expectancy()>=0?'+':'')+expectancy().toFixed(2)+'R';
  document.getElementById('stat-pf').textContent=profitFactor().toFixed(2);
  document.getElementById('an-pnl').textContent=fP(pnl);
  document.getElementById('an-pnl').style.color=pnl>=0?'var(--green)':'var(--red)';
  document.getElementById('an-wr').textContent=wr.toFixed(1)+'%';
  document.getElementById('an-awr').textContent='+'+avgWinR().toFixed(2)+'R';
  document.getElementById('an-alr').textContent='-'+avgLossR().toFixed(2)+'R';
  document.getElementById('pr-total').textContent=state.trades.length;
  document.getElementById('pr-pnl').textContent=fP(pnl);
  document.getElementById('pr-pnl').style.color=pnl>=0?'var(--green)':'var(--red)';
  document.getElementById('pr-wr').textContent=wr.toFixed(1)+'%';
  document.getElementById('pr-edge').textContent = state.trades.length > 0 ? es : '--';
  document.getElementById('pr-streak').textContent = streak > 0 ? streak : '0';
  document.getElementById('eq-trade-count').textContent=state.trades.length+' trades';
  document.getElementById('teeth-trades-count').textContent=state.trades.length+' trades';
  
  updateTradesPageStats();
}

function updateTradesPageStats(){
  const bal = (state.startingBalance || 0);
  const pnl = totalPnl();
  document.getElementById('trades-balance').textContent = '$' + bal.toLocaleString();
  document.getElementById('trades-pnl').textContent = fP(pnl);
  document.getElementById('trades-pnl').style.color = pnl >= 0 ? 'var(--green)' : 'var(--red)';
}

function showBalanceModal(){
  document.getElementById('balance-input').value = state.startingBalance || '';
  document.getElementById('balance-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBalanceModal(){
  document.getElementById('balance-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function saveBalance(){
  const balance = parseFloat(document.getElementById('balance-input').value) || 0;
  state.startingBalance = balance;
  localStorage.setItem('ev_balance', balance.toString());
  closeBalanceModal();
  renderAll();
}