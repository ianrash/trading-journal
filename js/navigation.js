// Navigation Functions

function nav(page){
  state.currentPage=page;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pageEl = document.getElementById('page-'+page);
  if(pageEl) pageEl.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.mob-btn').forEach(b=>b.classList.remove('active'));
  const nb=document.getElementById('nav-'+page);
  if(nb)nb.classList.add('active');
  const mb=document.getElementById('mob-'+page);
  if(mb)mb.classList.add('active');
  const titles={dashboard:getGreeting(),trades:'Trade Log',journal:'Journal',analytics:'Analytics',psychology:'Psychology',plan:'Trade Plan',calendar:'Calendar',settings:'Settings'};
  document.getElementById('topbar-title').textContent=titles[page]||page;
  document.getElementById('main-scroll').scrollTop=0;
  if(page==='analytics')setTimeout(renderAnalyticsCharts,50);
  if(page==='calendar')setTimeout(renderCalendar,50);
  if(page==='plan')setTimeout(renderPlanPage,50);
  if(page==='settings')setTimeout(renderSettings,50);
}

function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.body.classList.toggle('show-mobile-nav', name === 'app' || name === 'onboard');
}

function openProfile(){
  document.getElementById('profile-overlay').classList.add('open');
  document.getElementById('profile-panel').classList.add('open');
}

function closeProfile(){
  document.getElementById('profile-overlay').classList.remove('open');
  document.getElementById('profile-panel').classList.remove('open');
}

function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
}