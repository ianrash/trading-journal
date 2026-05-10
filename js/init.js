// Initialization

document.getElementById('login-pass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
document.getElementById('signup-pass').addEventListener('keydown',function(e){if(e.key==='Enter')doSignup();});

window.addEventListener('load',function(){
  initSupabase();
  handleAuthCallback(function(user){
    if(user){
      state.user = { name: user.user_metadata?.name || 'Trader', email: user.email, id: user.id };
      state.startingBalance = 10000;
      state.accountName = 'My Account';
      state.currency = 'USD';
      localStorage.setItem('ev_user', JSON.stringify(state.user));
      localStorage.setItem('ev_supa_user_id', user.id);
      loadJournalFromStorage();
      loadTradesFromStorage();
      loadSupabaseData();
      showScreen('app');
      setTopbarUser();
      loadProfilePic();
      updateCurrentDates();
      renderAll();
    } else {
      loadUserFromStorage();
    }
  });
});

function loadUserFromStorage(){
  const savedUser = localStorage.getItem('ev_user');
  const savedSupaUserId = localStorage.getItem('ev_supa_user_id');
  const savedBalance = localStorage.getItem('ev_balance');
  const savedAccount = localStorage.getItem('ev_account');
  
  if(savedUser && savedSupaUserId){
    const user = JSON.parse(savedUser);
    state.user = user;
    state.startingBalance = savedBalance ? parseFloat(savedBalance) : 0;
    state.accountName = savedAccount || '';
    state.currency = 'USD';
    _supaUserId = savedSupaUserId;
    _supaToken = 'authenticated';
    loadJournalFromStorage();
    loadTradesFromStorage();
    loadSupabaseData();
    showScreen('app');
    setTopbarUser();
    loadProfilePic();
    updateCurrentDates();
    renderAll();
  } else if(savedUser){
    const user = JSON.parse(savedUser);
    state.user = user;
    state.startingBalance = savedBalance ? parseFloat(savedBalance) : 0;
    state.accountName = savedAccount || '';
    state.currency = 'USD';
    loadJournalFromStorage();
    loadTradesFromStorage();
    showScreen('app');
    setTopbarUser();
    loadProfilePic();
    updateCurrentDates();
    renderAll();
  } else {
    showScreen('auth');
  }
}

function skipAuth(){
  state.user = { name: 'Trader', email: '', id: 'local_' + Date.now() };
  state.startingBalance = 0;
  state.accountName = 'My Account';
  state.currency = 'USD';
  localStorage.setItem('ev_user', JSON.stringify(state.user));
  localStorage.setItem('ev_balance', '0');
  localStorage.setItem('ev_account', 'My Account');
  loadJournalFromStorage();
  loadTradesFromStorage();
  showScreen('app');
  setTopbarUser();
  loadProfilePic();
  updateCurrentDates();
  renderAll();
}

function loadTradesFromStorage(){
  try{
    const saved = localStorage.getItem('ev_trades');
    if(saved){
      state.trades = JSON.parse(saved);
    }
  }catch(e){
    state.trades = [];
  }
}

function saveTradesToStorage(){
  try{
    localStorage.setItem('ev_trades', JSON.stringify(state.trades));
  }catch(e){}
}

function updateCurrentDates(){
  const today = new Date();
  const monthName = MONTHS_SHORT[today.getMonth()];
  const day = today.getDate();
  const year = today.getFullYear();
  
  document.getElementById('topbar-title').textContent = getGreeting();
  document.getElementById('topbar-sub').textContent = monthName + ' ' + day + ', ' + year + ' · ' + getSession();
  
  const journalHeader = document.querySelector('#page-journal .card-title');
  if(journalHeader){
    journalHeader.innerHTML = "Today's Entry <span style=\"font-size:11px;color:var(--muted);margin-left:8px;\">" + monthName + ' ' + day + ', ' + year + '</span>';
  }
  
  state.trades.forEach((t, i) => {
    if (t.id && t.id.startsWith('local_')) {
      const tradeDate = new Date(today);
      tradeDate.setDate(today.getDate() - i);
      t.date = MONTHS_SHORT[tradeDate.getMonth()] + ' ' + tradeDate.getDate();
    }
  });
  
  state.journal.forEach((j, i) => {
    const jDate = new Date(today);
    jDate.setDate(today.getDate() - (i + 1));
    j.date = MONTHS_SHORT[jDate.getMonth()] + ' ' + jDate.getDate();
  });
}

function getSession(){
  const hour = new Date().getHours();
  if(hour >= 7 && hour < 12) return 'London Open';
  if(hour >= 12 && hour < 17) return 'New York Open';
  if(hour >= 17 && hour < 21) return 'London Close';
  return 'Asian Session';
}