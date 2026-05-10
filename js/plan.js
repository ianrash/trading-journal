// Trade Plan Page Functions

function renderPlanPage(){
  renderChecklist();
  renderRules();
  renderGoals();
}

function renderChecklist(){
  const el=document.getElementById('checklist-items');
  el.innerHTML='';
  state.checklist.forEach(c=>{
    el.innerHTML+=`
    <div class="check-row" onclick="toggleCheck(${c.id})">
      <div class="check-box ${c.done?'done':''}">${c.done?'<svg width="11" height="11" fill="none" stroke="var(--green)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>
      <span class="check-label ${c.done?'done':''}">${_escapeHtml(c.text)}</span>
    </div>`;
  });
  const done=state.checklist.filter(c=>c.done).length;
  document.getElementById('checklist-badge').textContent=done+'/'+state.checklist.length+' done';
  document.getElementById('checklist-badge').className='badge '+(done===state.checklist.length?'badge-green':'badge-amber');
}

function toggleCheck(id){
  state.checklist=state.checklist.map(c=>c.id===id?{...c,done:!c.done}:c);
  renderChecklist();
}

function renderRules(){
  const el=document.getElementById('rules-list');
  el.innerHTML='';
  state.rules.forEach((r,i)=>{
    el.innerHTML+=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;display:flex;align-items:flex-start;gap:10px;padding:10px 12px;margin-bottom:8px;">
      <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted);margin-top:1px;min-width:16px;">${i+1}.</span>
      <div style="flex:1;">
        <div style="font-size:12px;color:var(--text);line-height:1.5;">${_escapeHtml(r.text)}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
          <span class="badge" style="background:${CAT_COLORS[r.category]||'#7968F2'}22;color:${CAT_COLORS[r.category]||'#7968F2'};border-color:${CAT_COLORS[r.category]||'#7968F2'}44;">${r.category}</span>
          ${r.violations>0?`<span style="font-size:10px;color:var(--amber);">${r.violations} violation${r.violations>1?'s':''}</span>`:''}
        </div>
      </div>
    </div>`;
  });
}

function addRule(){
  var input=document.getElementById('new-rule-input');
  if(!input||!input.value.trim()) return;
  var newRule={id:'local_'+Date.now(),text:input.value.trim(),category:'Risk',violations:0,violationDates:[]};
  state.rules.push(newRule);
  input.value='';
  renderRules();
  renderPsychologyPage();
  if(state.user&&state.user.id) supaSaveRule(state.user.id,newRule,null);
}

function addViolation(ruleId){
  const rule = state.rules.find(r => r.id === ruleId);
  if(rule){
    rule.violations = (rule.violations || 0) + 1;
    if(!rule.violationDates) rule.violationDates = [];
    rule.violationDates.push(new Date().toISOString());
    renderRules();
    renderPsychologyPage();
    renderGoals();
  }
}

function clearViolations(ruleId, monthFilter){
  const rule = state.rules.find(r => r.id === ruleId);
  if(!rule) return;
  if(!monthFilter || monthFilter === 'all'){
    rule.violations = 0;
    rule.violationDates = [];
  }else{
    const filter = getMonthFilter(monthFilter);
    if(filter){
      rule.violationDates = (rule.violationDates || []).filter(v => {
        const vDate = new Date(v);
        return !(vDate.getMonth() === filter.month && vDate.getFullYear() === filter.year);
      });
      rule.violations = rule.violationDates.length;
    }
  }
  renderRules();
  renderPsychologyPage();
  renderGoals();
}

function getMonthlyPnl(){
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  return state.trades.filter(t => {
    const parts = t.date.split(' ');
    if(parts.length >= 2){
      const monthNum = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11}[parts[0]];
      const monthDate = new Date(currentYear, monthNum, parseInt(parts[1]||1));
      return monthDate.getMonth() === currentMonth && monthDate.getFullYear() === currentYear;
    }
    return false;
  }).reduce((s,t) => s + t.pnl, 0);
}

function getMonthlyTradeCount(){
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  return state.trades.filter(t => {
    const parts = t.date.split(' ');
    if(parts.length >= 2){
      const monthNum = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11}[parts[0]];
      const monthDate = new Date(currentYear, monthNum, parseInt(parts[1]||1));
      return monthDate.getMonth() === currentMonth && monthDate.getFullYear() === currentYear;
    }
    return false;
  }).length;
}

function getGoalTargets(){
  const defaults = {monthlyPnl:2000,winRate:65,disciplineScore:80,tradesCount:50};
  try{
    const saved = localStorage.getItem('ev_goal_targets');
    return saved ? {...defaults, ...JSON.parse(saved)} : defaults;
  }catch(e){ return defaults; }
}

function saveGoalTargets(targets){
  try{ localStorage.setItem('ev_goal_targets', JSON.stringify(targets)); }catch(e){}
}

function renderGoals(){
  const targets = getGoalTargets();
  const pnl = getMonthlyPnl();
  const wr = winRate();
  const monthFilter = getMonthFilter(getCurrentMonth());
  const ds = disciplineScore(monthFilter);
  const tradesThisMonth = getMonthlyTradeCount();
  const goals = [
    {label:'Monthly P&L Target',target:targets.monthlyPnl,current:pnl,unit:'$',color:'var(--green)'},
    {label:'Win Rate Target',target:targets.winRate,current:wr,unit:'%',color:'var(--accent)'},
    {label:'Discipline Score',target:targets.disciplineScore,current:ds,unit:'',color:'var(--amber)'},
    {label:'Trades This Month',target:targets.tradesCount,current:tradesThisMonth,unit:'',color:'var(--text)'},
  ];
  const el = document.getElementById('goals-list');
  el.innerHTML = '';
  goals.forEach(g => {
    const pct = Math.min(100, (g.current / g.target) * 100);
    const dispCurrent = g.unit === '$' ? fP(g.current).replace('+', '') : g.unit === '%' ? g.current.toFixed(1) + '%' : g.current;
    const dispTarget = g.unit === '$' ? '$' + g.target : g.unit === '%' ? g.target + '%' : g.target;
    el.innerHTML += `
    <div class="goal-row">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:12px;color:var(--text);">${g.label}</span>
        <span style="font-family:'DM Mono',monospace;font-size:12px;color:${g.color};">${dispCurrent} <span style="color:var(--muted);">/ ${dispTarget}</span></span>
      </div>
      <div class="goal-bar-wrap"><div class="goal-bar" style="width:${pct}%;background:${g.color};"></div></div>
    </div>`;
  });
}