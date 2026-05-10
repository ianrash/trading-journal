// Journal Functions

function _escapeHtml(str){
  if(!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

const JOURNAL_PROMPTS = [
  "What's your bias for today?",
  "What's the one setup you're waiting for?",
  "What's your biggest concern for today's session?",
  "What would make you skip a trade today?",
  "What market conditions would you avoid trading?",
  "What's your goal for today's session?",
  "Which pair is giving you the best signals?",
  "What's one rule you must follow today?",
  "How will you handle a losing streak today?",
  "What's your confidence level right now?",
  "What's the highest probability setup you see?",
  "What time of day do you feel most focused?",
  "What's one thing you want to improve from yesterday?",
  "Are you trading for revenge or opportunity?",
  "What's your risk appetite for today?",
];

let currentPrompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];

function newPrompt(){
  currentPrompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
  document.getElementById('daily-prompt').textContent = currentPrompt;
  document.getElementById('prompt-answer').value = '';
}

function buildEmotionGrids(){
  const grids=['modal-emotion-grid','journal-emotion-grid'];
  grids.forEach(gid=>{
    const el=document.getElementById(gid);
    if(!el)return;
    el.innerHTML='';
    EMOTIONS.forEach(e=>{
      const btn=document.createElement('button');
      btn.className='emotion-btn'+(((gid==='modal-emotion-grid'&&state.formState.emotion===e)||(gid==='journal-emotion-grid'&&state.journalEmotion===e))?' active':'');
      btn.textContent=EMOJIS[e]+' '+e;
      btn.onclick=()=>{
        if(gid==='modal-emotion-grid'){state.formState.emotion=e;}
        else{state.journalEmotion=e;}
        el.querySelectorAll('.emotion-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      };
      el.appendChild(btn);
    });
  });
}

function updateMoodDisplay(v){
  const el=document.getElementById('mood-display');
  el.textContent=v+'/10';
  el.style.color=v>=7?'var(--green)':v>=5?'var(--amber)':'var(--red)';
}

function saveJournalEntry(){
  const entryText=document.getElementById('journal-entry-text').value.trim();
  if(!entryText) return;
  const today=new Date();
  const newEntry={
    id:'local_'+Date.now(),
    date:MONTHS_SHORT[today.getMonth()]+' '+today.getDate(),
    mood:parseInt(document.getElementById('mood-slider').value),
    emotion:state.journalEmotion,entry:entryText,
    lessons:document.getElementById('journal-lesson-text').value.trim()
  };
  state.journal.unshift(newEntry);
  saveJournalToStorage();
  document.getElementById('journal-entry-text').value='';
  document.getElementById('journal-lesson-text').value='';
  renderJournalPage();
  saveJournalToSupabase(newEntry);
}

function saveJournalToStorage(){
  try{
    localStorage.setItem('ev_journal', JSON.stringify(state.journal));
    localStorage.setItem('ev_prompt_answers', JSON.stringify(state.promptAnswers || []));
  }catch(e){console.error('Failed to save journal to storage:',e);}
}

function savePromptAnswer(){
  const answer = document.getElementById('prompt-answer').value.trim();
  if(!answer) return;
  
  if(!state.promptAnswers) state.promptAnswers = [];
  
  const today = new Date();
  const dateStr = MONTHS_SHORT[today.getMonth()] + ' ' + today.getDate();
  
  state.promptAnswers.unshift({
    id: 'local_' + Date.now(),
    date: dateStr,
    prompt: currentPrompt,
    answer: answer
  });
  saveJournalToStorage();
  
  if(_supaUserId){
    _supaPost('/rest/v1/prompt_answers',{
      user_id:_supaUserId,prompt_date:dateStr,
      prompt:currentPrompt,answer:answer,created_at:new Date().toISOString()
    },function(err,data){});
  }
  
  document.getElementById('prompt-answer').value = '';
  alert('Prompt saved!');
  newPrompt();
}

function loadJournalFromStorage(){
  try{
    const saved = localStorage.getItem('ev_journal');
    if(saved){
      state.journal = JSON.parse(saved);
    }
    const prompts = localStorage.getItem('ev_prompt_answers');
    if(prompts){
      state.promptAnswers = JSON.parse(prompts);
    }
  }catch(e){
    console.error('Failed to load journal from storage:',e);
    state.journal = [];
    state.promptAnswers = [];
  }
}

function renderJournalPage(){
  const el=document.getElementById('journal-list');
  let html='';
  state.journal.forEach(j=>{
    const col=j.mood>=7?'var(--green)':j.mood>=5?'var(--amber)':'var(--red)';
    const lo=j.mood>=7?'var(--green-lo)':j.mood>=5?'var(--amber-lo)':'var(--red-lo)';
    html+=`
    <div class="journal-entry-card" id="je-${j.id}">
      <div class="je-header" onclick="toggleJE(${j.id})">
        <div class="je-mood" style="background:${lo};border:1px solid ${col}33;color:${col};">${j.mood}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;">${j.date} ${j.emotion?EMOJIS[j.emotion]||'':''}</div>
          <div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">${_escapeHtml(j.entry.substring(0,60))}...</div>
        </div>
        <svg width="14" height="14" fill="none" stroke="var(--muted)" stroke-width="2" viewBox="0 0 24 24" class="je-chevron"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="je-body">
        <p style="font-size:13px;color:var(--text);line-height:1.7;margin-bottom:10px;">${_escapeHtml(j.entry)}</p>
        ${j.lessons?`<div class="lesson-box"><div class="lesson-box-label">Lesson</div><div style="font-size:12px;font-style:italic;color:var(--text);">${_escapeHtml(j.lessons)}</div></div>`:''}
      </div>
    </div>`;
  });
  el.innerHTML=html;
}

function toggleJE(id){
  const el = document.getElementById('je-'+id);
  if(el) el.classList.toggle('open');
}