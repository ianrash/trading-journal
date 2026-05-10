// Psychology Page Functions

if(state && !state.disciplineFilter) state.disciplineFilter = 'all';

function renderPsychologyPage(){
  const filter = state.disciplineFilter === 'all' ? null : getMonthFilter(state.disciplineFilter);
  const ds = disciplineScore(filter);
  const vc = violationCount(filter);
  const dsEl = document.getElementById('disc-score-big');
  if(dsEl){
    dsEl.textContent=ds;
    dsEl.style.color=ds>=75?'var(--green)':ds>=50?'var(--amber)':'var(--red)';
  }
  const barEl = document.getElementById('disc-bar');
  if(barEl){
    barEl.style.width=ds+'%';
    barEl.style.background=ds>=75?'var(--green)':ds>=50?'var(--amber)':'var(--red)';
  }
  const violCountEl = document.getElementById('disc-viol-count');
  if(violCountEl){
    const label = state.disciplineFilter === 'all' ? 'total violations' : `violations in ${state.disciplineFilter}`;
    violCountEl.textContent=vc + ' ' + label;
  }
  const psychViolEl = document.getElementById('psych-violations');
  if(psychViolEl) psychViolEl.textContent=vc;
  if(psychViolEl) psychViolEl.style.color=vc>8?'var(--red)':vc>4?'var(--amber)':'var(--green)';
  const revenge=state.trades.filter(t=>(t.emotion==='Greedy'||t.emotion==='Frustrated')&&t.outcome==='LOSS').length;
  const revengeEl = document.getElementById('psych-revenge');
  if(revengeEl) revengeEl.textContent=revenge;
  const calmEl = document.getElementById('psych-calm');
  if(calmEl) calmEl.textContent=state.trades.filter(t=>t.emotion==='Calm'||t.emotion==='Confident').length;
  const fomoEl = document.getElementById('psych-fomo');
  if(fomoEl) fomoEl.textContent=state.trades.filter(t=>t.emotion==='Greedy'||t.emotion==='Anxious').length;
  const el=document.getElementById('rule-violations-list');
  if(!el) return;
  el.innerHTML='';
  state.rules.forEach(r=>{
    let rViolations = r.violations || 0;
    if(filter && r.violationDates){
      rViolations = r.violationDates.filter(v => {
        const vDate = new Date(v);
        return vDate.getMonth() === filter.month && vDate.getFullYear() === filter.year;
      }).length;
    }
    const col=rViolations===0?'var(--green)':rViolations<=2?'var(--amber)':'var(--red)';
    const bgLo=rViolations===0?'var(--green-lo)':rViolations<=2?'var(--amber-lo)':'var(--red-lo)';
    el.innerHTML+=`
    <div class="rule-row" style="border-color:${rViolations>2?'rgba(255,51,102,0.2)':'var(--border)'};">
      <div class="rule-icon" style="background:${bgLo};border:1px solid ${col}33;">
        ${rViolations===0?'✓':'⚠'}
      </div>
      <div style="flex:1;">
        <div style="font-size:12px;color:var(--text);line-height:1.4;">${_escapeHtml ? _escapeHtml(r.text) : r.text}</div>
        <span class="badge" style="background:${CAT_COLORS[r.category]||'#7968F222'}22;color:${CAT_COLORS[r.category]||'#7968F2'};border-color:${CAT_COLORS[r.category]||'#7968F244'};">${r.category}</span>
      </div>
      <div class="rule-viol-count" style="color:${col};">${rViolations}</div>
    </div>`;
  });
  const dot=document.getElementById('psych-dot');
  if(dot){dot.style.display=vc>5?'block':'none';}
}

function setDisciplineFilter(filter){
  state.disciplineFilter = filter;
  renderPsychologyPage();
}