// Settings Functions

function renderSettings(){
  document.getElementById('settings-account-name').value = state.accountName || '';
  document.getElementById('settings-balance').value = state.startingBalance || '';
  document.getElementById('settings-currency').value = state.currency || 'USD';
  document.getElementById('settings-name').value = state.user?.name || '';
  document.getElementById('settings-email').value = state.user?.email || '';
  document.getElementById('settings-risk').value = state.defaultRisk || '1.0';
  document.getElementById('settings-daily-loss').value = state.dailyLossLimit || '3.0';
}

function saveSettings(){
  state.accountName = document.getElementById('settings-account-name').value || 'My Account';
  var balanceInput=parseFloat(document.getElementById('settings-balance').value);
  if(isNaN(balanceInput)||balanceInput<0){
    alert('Please enter a valid positive number for balance');
    return;
  }
  if(balanceInput>100000000){
    alert('Balance cannot exceed $100,000,000');
    return;
  }
  state.startingBalance=balanceInput;
  state.currency = document.getElementById('settings-currency').value || 'USD';
  
  if(state.user){
    state.user.name = document.getElementById('settings-name').value || 'Trader';
    state.user.email = document.getElementById('settings-email').value || '';
    localStorage.setItem('ev_user', JSON.stringify(state.user));
  }
  
  localStorage.setItem('ev_balance', state.startingBalance.toString());
  localStorage.setItem('ev_account', state.accountName);
  
  state.defaultRisk = parseFloat(document.getElementById('settings-risk').value) || 1.0;
  state.dailyLossLimit = parseFloat(document.getElementById('settings-daily-loss').value) || 3.0;
  
  localStorage.setItem('ev_settings', JSON.stringify({
    defaultRisk: state.defaultRisk,
    dailyLossLimit: state.dailyLossLimit
  }));
  
  renderAll();
}