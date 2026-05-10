// EdgeVault - Supabase Backend Client

// SECURITY: Supabase anon key is public by design - Row Level Security (RLS) must be enabled
// on all tables in Supabase dashboard to protect user data. Client-side key exposure is expected.
// For production, use environment variables: import.meta.env.VITE_SUPABASE_URL/KEY
var SUPA_URL = 'https://zxkcansffehulqdzamnw.supabase.co';
var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a2NhbnNmZmVodWxxZHphbW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTcwNjAsImV4cCI6MjA5MzgzMzA2MH0.TvZDN_r5udj9ccHvG-rGZGxWyZWy8op54Kj1qdfGeaY';

var _supaToken  = null;
var _supaUserId = null;
var _isOnline   = false;
var _wasOffline = false;

window.addEventListener('online',function(){
  if(_wasOffline){
    _wasOffline=false;
    try{localStorage.removeItem('ev_cache_trades_'+_supaUserId);}catch(e){}
    try{localStorage.removeItem('ev_cache_journal_entries_'+_supaUserId);}catch(e){}
  }
});
window.addEventListener('offline',function(){
  _wasOffline=true;
});

// Handle Supabase implicit flow tokens in URL hash
(function(){
  try{
    var hash = window.location.hash;
    if(hash && hash.indexOf('access_token=') !== -1){
      var params = new URLSearchParams(hash.substring(1));
      var token = params.get('access_token');
      var refresh = params.get('refresh_token');
      var type = params.get('type');
      if(token){
        _supaToken = token;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', SUPA_URL + '/auth/v1/user', true);
        xhr.setRequestHeader('apikey', SUPA_KEY);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.onreadystatechange = function(){
          if(xhr.readyState !== 4) return;
          try{
            var user = JSON.parse(xhr.responseText);
            if(user && user.id){
              _supaUserId = user.id;
              localStorage.setItem('ev_session', JSON.stringify({
                access_token: token,
                refresh_token: refresh||'',
                user: user
              }));
              window.history.replaceState({}, document.title,
                window.location.origin + window.location.pathname);
            }
          }catch(e){}
        };
        xhr.send(null);
      }
    }
  }catch(e){}
})();

// SECURITY: Removed insecure _simpleHash - it provided zero security (trivial polynomial hash)
// and storing password hashes in localStorage is inherently unsafe
// Offline login now uses only secure session tokens from ev_session

function _offlineLogin(email,password,callback){
  try{
    var storedSess =localStorage.getItem('ev_session');
    if(storedSess){
      var sess=JSON.parse(storedSess);
      if(sess.access_token && sess.user){
        _supaToken =sess.access_token;
        _supaUserId=sess.user?sess.user.id:null;
        showOfflineBanner();
        callback(null,sess.user);
        return;
      }
    }
  }catch(e){}
  callback('No internet. Please connect and try again.',null);
}

function showOfflineBanner(){
  var b=document.getElementById('offline-banner');
  if(b) b.style.display='flex';
}
function hideOfflineBanner(){
  var b=document.getElementById('offline-banner');
  if(b) b.style.display='none';
}

function _localSave(key,data){
  try{ localStorage.setItem('ev_cache_'+key,JSON.stringify(data)); }catch(e){}
}
function _localLoad(key,def){
  try{ var d=localStorage.getItem('ev_cache_'+key); return d?JSON.parse(d):def; }
  catch(e){ return def; }
}

// PKCE / EMAIL VERIFICATION CALLBACK
function handleAuthCallback(callback){
  var params = new URLSearchParams(window.location.search);
  var code   = params.get('code');
  var type   = params.get('type');
  var token  = params.get('access_token');
  var refreshToken = params.get('refresh_token');

  function cleanUrl(){
    try{
      var clean = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, clean);
    }catch(e){}
  }

  if(code){
    cleanUrl();
    exchangeCodeForSession(code, function(err, session){
      if(err){
        console.error('Code exchange failed:', err);
        callback(null);
        return;
      }
      if(session && session.access_token){
        _supaToken  = session.access_token;
        _supaUserId = session.user ? session.user.id : null;
        try{
          localStorage.setItem('ev_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user
          }));
        }catch(e){}
        _isOnline = true;
        callback(session.user);
      } else {
        callback(null);
      }
    });
  } else if(token){
    cleanUrl();
    _supaToken  = token;
    try{
      localStorage.setItem('ev_session', JSON.stringify({
        access_token: token,
        refresh_token: refreshToken||'',
        user: null
      }));
    }catch(e){}
    _supaGet('/auth/v1/user', function(err, user){
      if(!err && user){
        try{
          var sess = JSON.parse(localStorage.getItem('ev_session')||'{}');
          sess.user = user;
          localStorage.setItem('ev_session', JSON.stringify(sess));
        }catch(e){}
        callback(user);
      } else {
        callback(null);
      }
    });
  } else {
    callback(null);
  }
}

function exchangeCodeForSession(code, callback){
  _supaPost('/auth/v1/token?grant_type=pkce', {
    auth_code: code,
    redirect_to: window.location.origin + window.location.pathname
  }, function(err, data){
    if(err){
      _supaPost('/auth/v1/token?grant_type=authorization_code', {
        code: code
      }, function(err2, data2){
        if(err2){ callback(err2, null); }
        else { callback(null, data2); }
      });
      return;
    }
    callback(null, data);
  });
}

function showEmailConfirmScreen(email){
  var card = document.querySelector('.auth-card');
  if(!card) return;
  card.innerHTML = '<div style="text-align:center;padding:16px 0;">' +
    '<div style="font-size:40px;margin-bottom:16px;">📧</div>' +
    '<div style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:8px;">Check your email</div>' +
    '<div style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:20px;">We sent a verification link to<br>' +
    '<strong style="color:var(--accent);">'+email+'</strong><br><br>' +
    'Click the link in the email to verify your account. Once verified, come back here and log in.</div>' +
    '<button onclick="location.reload()" style="width:100%;background:var(--accent);color:#fff;border:none;border-radius:12px;padding:12px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:10px;">I\'ve verified — Log In</button>' +
    '<button onclick="switchAuthTab(\'login\')" style="width:100%;background:none;border:1px solid var(--border);color:var(--muted);border-radius:12px;padding:10px;cursor:pointer;font-size:13px;">Back to Login</button>' +
    '<div style="font-size:11px;color:var(--muted);margin-top:12px;">Didn\'t receive it? Check spam or ' +
    '<span onclick="doSignup()" style="color:var(--accent);cursor:pointer;">resend</span></div>' +
    '</div>';
}

function initSupabase(){
  try{
    var stored=localStorage.getItem('ev_session');
    if(stored){
      var sess=JSON.parse(stored);
      if(sess&&sess.access_token&&sess.user){
        _supaToken =sess.access_token;
        _supaUserId=sess.user.id;
      }
    }
  }catch(e){}
}

function _supaHeaders(){
  return {
    'Content-Type':'application/json',
    'apikey':SUPA_KEY,
    'Authorization':'Bearer '+(_supaToken||SUPA_KEY)
  };
}

function _xhr(method,url,headers,body,callback){
  var xhr=new XMLHttpRequest();
  xhr.open(method,url,true);
  for(var h in headers) xhr.setRequestHeader(h,headers[h]);
  xhr.timeout=12000;
  xhr.onreadystatechange=function(){
    if(xhr.readyState!==4) return;
    var st=xhr.status;
    if(st===0){ _isOnline=false; callback('offline',null); return; }
    _isOnline=true;
    if(st===204){ callback(null,null); return; }
    var data=null;
    try{ data=JSON.parse(xhr.responseText); }catch(e){ data=xhr.responseText; }
    if(st>=200&&st<300){ callback(null,data); }
    else{ callback((data&&(data.message||data.error_description||data.msg))||('Error '+st),null); }
  };
  xhr.onerror  =function(){ _isOnline=false; callback('offline',null); };
  xhr.ontimeout=function(){ _isOnline=false; callback('timeout',null); };
  try{ xhr.send(body?JSON.stringify(body):null); }
  catch(e){ _isOnline=false; callback('offline',null); }
}

function _supaGet(path,cb){ _xhr('GET',SUPA_URL+path,_supaHeaders(),null,cb); }
function _supaPost(path,body,cb){ _xhr('POST',SUPA_URL+path,_supaHeaders(),body,cb); }
function _supaPostReturn(path,body,cb){
  var h=_supaHeaders(); h['Prefer']='return=representation';
  _xhr('POST',SUPA_URL+path,h,body,cb);
}
function _supaUpsert(path,body,cb){
  var h=_supaHeaders(); h['Prefer']='resolution=merge-duplicates,return=minimal';
  _xhr('POST',SUPA_URL+path,h,body,cb);
}

function supaSelect(table,eqCol,eqVal,cb){
  var path='/rest/v1/'+table+'?select=*&'+eqCol+'=eq.'+encodeURIComponent(eqVal)+'&order=created_at.desc';
  _supaGet(path,function(err,data){ cb(err,Array.isArray(data)?data:[]); });
}
function supaInsertRow(table,row,cb){
  _supaPostReturn('/rest/v1/'+table,row,function(err,data){
    if(err){ if(cb)cb(err,null); return; }
    if(cb) cb(null,Array.isArray(data)?data[0]:data);
  });
}
function supaUpsertRow(table,row,cb){
  _supaUpsert('/rest/v1/'+table,row,function(err){ if(cb)cb(err); });
}

function _supaLoadWithCache(table,eqCol,eqVal,cb){
  var cacheKey=table+'_'+eqVal;
  supaSelect(table,eqCol,eqVal,function(err,data){
    if(err==='offline'||err==='timeout'){
      _isOnline=false; showOfflineBanner();
      cb(null,_localLoad(cacheKey,[]));
    } else if(err){
      cb(null,_localLoad(cacheKey,[]));
    } else {
      _localSave(cacheKey,data);
      cb(null,data);
    }
  });
}

// AUTH
function supaSignUp(email,password,name,callback){
  var redirectTo = window.location.origin + window.location.pathname;
  _supaPost('/auth/v1/signup',{
    email:email, password:password,
    data:{name:name},
    options:{emailRedirectTo: redirectTo}
  },function(err,data){
    if(err==='offline'||err==='timeout'){
      var fakeUser={id:'local_'+Date.now(),email:email,user_metadata:{name:name}};
      var fakeSess={access_token:'local_'+Date.now(),user:fakeUser};
      try{
        localStorage.setItem('ev_session',JSON.stringify(fakeSess));
      }catch(e){}
      _supaToken=fakeSess.access_token; _supaUserId=fakeUser.id;
      showOfflineBanner(); callback(null,fakeUser); return;
    }
    if(err){ callback(err,null); return; }
    if(data&&data.access_token){
      _supaToken=data.access_token;
      _supaUserId=data.user?data.user.id:null;
      try{
        localStorage.setItem('ev_session',JSON.stringify({access_token:data.access_token,user:data.user}));
      }catch(e){}
      callback(null,data.user);
    } else if(data&&data.user&&!data.access_token){
      callback('CONFIRM_EMAIL',data.user);
    } else {
      callback(null, data?data.user:null);
    }
  });
}

function supaSignIn(email,password,callback){
  _supaPost('/auth/v1/token?grant_type=password',{email:email,password:password},function(err,data){
    if(err==='offline'||err==='timeout'){ _offlineLogin(email,password,callback); return; }
    if(err){ callback(err,null); return; }
    if(data&&data.access_token){
      _supaToken=data.access_token;
      _supaUserId=data.user?data.user.id:null;
      try{
        localStorage.setItem('ev_session',JSON.stringify({access_token:data.access_token,user:data.user}));
      }catch(e){}
      _isOnline=true; callback(null,data.user);
    } else {
      callback('Invalid email or password',null);
    }
  });
}

function supaSignOut(callback){
  _supaPost('/auth/v1/logout',{},function(){
    _supaToken=null; _supaUserId=null;
    try{ localStorage.removeItem('ev_session'); }catch(e){}
    if(callback) callback();
  });
}

function supaGetSession(callback){
  initSupabase();
  if(!_supaToken){ callback(null); return; }
  if(_supaToken.indexOf('local_')===0){
    try{
      var sess=JSON.parse(localStorage.getItem('ev_session')||'{}');
      showOfflineBanner();
      callback(sess.user||null);
    }catch(e){ callback(null); }
    return;
  }
  _supaGet('/auth/v1/user',function(err,user){
    if(err==='offline'||err==='timeout'){
      try{
        var sess2=JSON.parse(localStorage.getItem('ev_session')||'{}');
        if(sess2.user){ showOfflineBanner(); callback(sess2.user); return; }
      }catch(e){}
      callback(null);
    } else if(err){
      _supaToken=null; _supaUserId=null;
      try{ localStorage.removeItem('ev_session'); }catch(e){}
      callback(null);
    } else {
      _isOnline=true; hideOfflineBanner(); callback(user);
    }
  });
}

// PROFILE
function supaLoadProfile(userId,callback){
  if(!userId||userId.indexOf('local_')===0){ callback(null); return; }
  _supaLoadWithCache('profiles','id',userId,function(err,data){ callback(data&&data.length?data[0]:null); });
}
function supaSaveProfile(userId,stateData,callback){
  if(!userId||userId.indexOf('local_')===0){ if(callback)callback(); return; }
  supaUpsertRow('profiles',{
    id:userId,
    name:stateData.user?stateData.user.name:'Trader',
    starting_balance:stateData.startingBalance||10000,
    account_name:stateData.accountName||'My Live Account',
    currency:stateData.currency||'USD',
    settings:stateData.settings||{}
  },callback);
}

// TRADES
function supaLoadTrades(userId,callback){
  if(!userId||userId.indexOf('local_')===0){
    callback(_localLoad('trades_'+userId,[])); return;
  }
  _supaLoadWithCache('trades','user_id',userId,function(err,data){
    if(!data){ callback([]); return; }
    callback(data.map(function(t){
      return {
        id:t.id,pair:t.pair||'',dir:t.direction||'BUY',
        entry:parseFloat(t.entry_price)||0,sl:parseFloat(t.stop_loss)||0,
        tp:parseFloat(t.take_profit)||0,riskPct:parseFloat(t.risk_pct)||1,
        pnl:parseFloat(t.pnl)||0,r:parseFloat(t.r_multiple)||0,
        session:t.session||'London',setup:t.setup||'',emotion:t.emotion||'Neutral',
        rating:t.rating||4,notes:t.notes||'',outcome:t.outcome||'WIN',
        date:t.trade_date||'',
        screenshots:{htf:t.screenshot_htf||null,mtf:t.screenshot_mtf||null,ltf:t.screenshot_ltf||null}
      };
    }));
  });
}

function supaSaveTrade(userId,trade,callback){
  var cKey='trades_'+userId;
  var cached=_localLoad(cKey,[]);
  cached.unshift(trade);
  _localSave(cKey,cached.slice(0,500));
  if(!_isOnline||!userId||userId.indexOf('local_')===0){ if(callback)callback(null,trade); return; }
  supaInsertRow('trades',{
    user_id:userId,pair:trade.pair,direction:trade.dir,outcome:trade.outcome,
    entry_price:trade.entry,stop_loss:trade.sl,take_profit:trade.tp,
    risk_pct:trade.riskPct,pnl:trade.pnl,r_multiple:trade.r,
    session:trade.session,setup:trade.setup,emotion:trade.emotion,
    rating:trade.rating,notes:trade.notes,trade_date:trade.date,
    screenshot_htf:trade.screenshots?trade.screenshots.htf:null,
    screenshot_mtf:trade.screenshots?trade.screenshots.mtf:null,
    screenshot_ltf:trade.screenshots?trade.screenshots.ltf:null
  },callback);
}

// JOURNAL
function supaLoadJournal(userId,callback){
  if(!userId||userId.indexOf('local_')===0){
    callback(_localLoad('journal_'+userId,[])); return;
  }
  _supaLoadWithCache('journal_entries','user_id',userId,function(err,data){
    if(!data){ callback([]); return; }
    callback(data.map(function(j){
      return {id:j.id,date:j.entry_date||'',mood:j.mood||5,
        emotion:j.emotion||'Neutral',entry:j.content||'',lessons:j.lessons||''};
    }));
  });
}
function supaSaveJournal(userId,entry,callback){
  var cKey='journal_'+userId;
  var cached=_localLoad(cKey,[]);
  cached.unshift(entry);
  _localSave(cKey,cached.slice(0,200));
  if(!_isOnline||!userId||userId.indexOf('local_')===0){ if(callback)callback(null,entry); return; }
  supaInsertRow('journal_entries',{
    user_id:userId,entry_date:entry.date,mood:entry.mood,
    emotion:entry.emotion,content:entry.entry,lessons:entry.lessons
  },callback);
}

// RULES
function supaLoadRules(userId,callback){
  if(!userId||userId.indexOf('local_')===0){ callback([]); return; }
  _supaLoadWithCache('rules','user_id',userId,function(err,data){
    if(!data){ callback([]); return; }
    callback(data.map(function(r){
      return {id:r.id,text:r.text,category:r.category||'Risk',violations:r.violations||0};
    }));
  });
}
function supaSaveRule(userId,rule,callback){
  if(!_isOnline||!userId||userId.indexOf('local_')===0){ if(callback)callback(); return; }
  supaInsertRow('rules',{
    user_id:userId,text:rule.text,category:rule.category||'Risk',violations:rule.violations||0
  },function(err){ if(callback)callback(err); });
}
function supaUploadScreenshot(userId, label, dataUrl, callback){
  console.warn('Screenshot upload is a stub - screenshots will not persist across sessions or devices. To implement, set up Supabase Storage bucket and upload there.');
  callback(null, dataUrl);
}