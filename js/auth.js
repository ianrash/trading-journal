// Auth Functions

function testSupabase(){
  fetch(SUPA_URL + '/rest/v1/users?limit=1', {
    method: 'GET',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY
    }
  })
  .then(res => res.text())
  .then(data => {
    console.log('Supabase test OK:', data.substring(0,100));
    alert('Supabase OK! Response: ' + data.substring(0,100));
  })
  .catch(err => {
    console.log('Supabase test FAILED:', err);
    alert('Supabase FAILED: ' + err);
  });
}

function switchAuthTab(tab){
  document.getElementById('tab-login').classList.toggle('active',tab==='login');
  document.getElementById('tab-signup').classList.toggle('active',tab==='signup');
  document.getElementById('auth-login').style.display = tab==='login'?'block':'none';
  document.getElementById('auth-signup').style.display = tab==='signup'?'block':'none';
}

function doLogin(){
  const email = (document.getElementById('login-email').value || '').trim();
  const pass = document.getElementById('login-pass').value || '';
  if(!email || !pass){showAuthError('Please enter email and password.');return;}
  
  setAuthLoading(true,'Signing in...');
  console.log('Logging in with email:', email);
  
  supaSignIn(email, pass, function(err, user){
    setAuthLoading(false,'');
    if(err){
      if(err === 'CONFIRM_EMAIL'){
        showAuthError('Please verify your email first. Check your inbox.');
      } else {
        showAuthError(err);
      }
      return;
    }
    if(user){
      afterLoginSuccess(user);
    } else {
      showAuthError('Invalid email or password.');
    }
  });
}

function doSignup(){
  const name = (document.getElementById('signup-name').value || '').trim();
  const email = (document.getElementById('signup-email').value || '').trim();
  const pass = document.getElementById('signup-pass').value || '';
  
  if(!name){showAuthError('Please enter your name.');return;}
  if(!email){showAuthError('Please enter your email.');return;}
  if(pass.length<6){showAuthError('Password must be at least 6 characters.');return;}
  
  setAuthLoading(true,'Creating account...');
  console.log('Creating user with email:', email);
  
  supaSignUp(email, pass, name, function(err, user){
    setAuthLoading(false,'');
    if(err){
      if(err === 'CONFIRM_EMAIL'){
        showEmailConfirmScreen(email);
      } else {
        showAuthError(err);
      }
      return;
    }
    if(user){
      afterLoginSuccess(user);
    } else {
      showAuthError('Account created. Please log in.');
      switchAuthTab('login');
    }
  });
}

function afterLoginSuccess(user){
  _supaUserId = user.id;
  const userName = user.user_metadata?.name || user.name || 'Trader';
  state.user = { name: userName, email: user.email, id: user.id };
  state.startingBalance = user.starting_balance || user.startingBalance || 10000;
  state.accountName = user.account_name || user.accountName || 'My Account';
  state.currency = user.currency || 'USD';
  
  localStorage.setItem('ev_user', JSON.stringify(state.user));
  localStorage.setItem('ev_balance', state.startingBalance.toString());
  localStorage.setItem('ev_account', state.accountName);
  localStorage.setItem('ev_supa_user_id', user.id);
  
  supaLoadProfile(user.id, function(profile){
    if(profile){
      state.startingBalance = profile.starting_balance || 10000;
      state.accountName = profile.account_name || 'My Account';
      state.currency = profile.currency || 'USD';
      localStorage.setItem('ev_balance', state.startingBalance.toString());
      localStorage.setItem('ev_account', state.accountName);
    }
    loadSupabaseData();
    showScreen('app');
    setTopbarUser();
    loadProfilePic();
    updateCurrentDates();
    renderAll();
  });
}

function loadSupabaseData(){
  if(!_supaUserId) return;
  
  _supaGet('/rest/v1/trades?user_id=eq.'+_supaUserId+'&order=created_at.desc&limit=500',function(err,data){
    if(!err && data){
      state.trades = data.map(function(t){
        return {
          id:t.id,pair:t.pair,dir:t.direction,entry:parseFloat(t.entry_price)||0,
          sl:parseFloat(t.stop_loss)||0,tp:parseFloat(t.take_profit)||0,riskPct:parseFloat(t.risk_pct)||1,
          pnl:parseFloat(t.pnl)||0,r:parseFloat(t.r_multiple)||0,
          session:t.session,setup:t.setup,emotion:t.emotion||'Neutral',
          rating:t.rating||4,notes:t.notes||'',outcome:t.outcome||'WIN',
          date:t.trade_date||'',tags:t.tags||[],
          screenshots:{htf:t.screenshot_htf||null,mtf:t.screenshot_mtf||null,ltf:t.screenshot_ltf||null}
        };
      });
    }
  });
  
  _supaGet('/rest/v1/journal_entries?user_id=eq.'+_supaUserId+'&order=created_at.desc&limit=200',function(err,data){
    if(!err && data){
      state.journal = data.map(function(j){
        return {id:j.id,date:j.entry_date||'',mood:j.mood||5,emotion:j.emotion||'Neutral',entry:j.content||'',lessons:j.lessons||''};
      });
    }
    renderJournalPage();
  });
}

function saveTradeToSupabase(trade){
  if(!_supaUserId) return;
  _supaPost('/rest/v1/trades',{
    user_id:_supaUserId,pair:trade.pair,direction:trade.dir,outcome:trade.outcome,
    entry_price:trade.entry,stop_loss:trade.sl,take_profit:trade.tp,
    risk_pct:trade.riskPct,pnl:trade.pnl,r_multiple:trade.r,
    session:trade.session,setup:trade.setup,emotion:trade.emotion,
    rating:trade.rating,notes:trade.notes,trade_date:trade.date,
    tags:trade.tags||[],
    screenshot_htf:trade.screenshots?trade.screenshots.htf:null,
    screenshot_mtf:trade.screenshots?trade.screenshots.mtf:null,
    screenshot_ltf:trade.screenshots?trade.screenshots.ltf:null,
    created_at:new Date().toISOString()
  },function(err,data){
    if(!err && data && data.id){
      for(var i=0;i<state.trades.length;i++){
        if(state.trades[i].id===trade.id){state.trades[i].id=data.id;break;}
      }
    }
  });
}

function saveJournalToSupabase(entry){
  if(!_supaUserId) return;
  _supaPost('/rest/v1/journal_entries',{
    user_id:_supaUserId,entry_date:entry.date,mood:entry.mood,
    emotion:entry.emotion,content:entry.entry,lessons:entry.lessons,
    created_at:new Date().toISOString()
  },function(err,data){
    if(!err && data && data.id){
      for(var i=0;i<state.journal.length;i++){
        if(state.journal[i].id===entry.id){state.journal[i].id=data.id;break;}
      }
    }
  });
}

function setAuthLoading(on,msg){
  var lb=document.getElementById('auth-login-btn');
  var sb=document.getElementById('auth-signup-btn');
  if(lb){lb.disabled=on;if(on)lb.textContent=msg;else lb.textContent='Log In to EdgeVault';}
  if(sb){sb.disabled=on;if(on)sb.textContent=msg;else sb.textContent='Create Free Account';}
  if(!on){var e=document.getElementById('auth-error');if(e)e.style.display='none';}
}

function showAuthError(msg){
  var e=document.getElementById('auth-error');
  if(e){e.textContent=msg;e.style.display='block';}
}

let testSupabasePending=false;
function testSupabase(){
  if(testSupabasePending)return;
  testSupabasePending=true;
  fetch(SUPA_URL + '/rest/v1/users?limit=1', {
    method: 'GET',
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY
    }
  })
  .then(res => res.text())
  .then(data => {
    console.log('Supabase test OK:', data.substring(0,100));
    alert('Supabase OK! Response: ' + data.substring(0,100));
  })
  .catch(err => {
    console.log('Supabase test FAILED:', err);
    alert('Supabase FAILED: ' + err);
  })
  .finally(()=>{testSupabasePending=false;});
}

function setTopbarUser(){
  const n = state.user?.name||'Trader';
  const firstName = n ? n.split(' ')[0] : 'Trader';
  document.getElementById('topbar-username').textContent = firstName;
  document.getElementById('profile-name').textContent = n;
  document.getElementById('profile-email').textContent = state.user?.email||'trader@edgevault.app';
  document.getElementById('profile-avatar').textContent = n ? n.charAt(0).toUpperCase() : 'T';
}

function doLogout(){
  closeProfile();
  localStorage.removeItem('ev_user');
  localStorage.removeItem('ev_supa_user_id');
  state.user = null;
  state.trades = [];
  state.journal = [];
  _supaUserId = null;
  _supaToken = null;
  showScreen('auth');
}

function _supaGet(path, cb){
  const xhr = new XMLHttpRequest();
  xhr.open('GET', SUPA_URL + path, true);
  xhr.setRequestHeader('apikey', SUPA_KEY);
  xhr.setRequestHeader('Authorization', 'Bearer ' + (_supaToken || SUPA_KEY));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function(){
    if(xhr.readyState !== 4) return;
    if(xhr.status >= 200 && xhr.status < 300){
      try{ const d = JSON.parse(xhr.responseText); cb(null, d, xhr.status); }catch(e){ cb(null, []); }
    } else { cb('error ' + xhr.status, null, xhr.status); }
  };
  xhr.send();
}

function _supaPost(path, body, cb){
  const xhr = new XMLHttpRequest();
  xhr.open('POST', SUPA_URL + path, true);
  xhr.setRequestHeader('apikey', SUPA_KEY);
  xhr.setRequestHeader('Authorization', 'Bearer ' + (_supaToken || SUPA_KEY));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Prefer', 'return=representation');
  xhr.onreadystatechange = function(){
    if(xhr.readyState !== 4) return;
    if(xhr.status >= 200 && xhr.status < 300){
      try{ const d = JSON.parse(xhr.responseText); cb(null, d); }catch(e){ cb(null, body); }
    } else { cb(xhr.responseText, null); }
  };
  xhr.send(JSON.stringify(body));
}