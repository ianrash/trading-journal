// Add Trade Modal Functions

function openAddTrade(){
  const overlay=document.getElementById('add-trade-modal');
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
  state.formState={dir:'BUY',outcome:'WIN',emotion:'Calm',rating:4,screenshots:{htf:null,mtf:null,ltf:null},tags:[]};
  document.getElementById('f-entry').value='';
  document.getElementById('f-sl').value='';
  document.getElementById('f-tp').value='';
  document.getElementById('f-pnl').value='';
  document.getElementById('f-r').value='';
  document.getElementById('f-notes').value='';
  document.getElementById('f-risk').value='1.0';
  document.getElementById('calc-pill').style.display='none';
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('f-date').value=today;
  setDir('BUY');setOutcome('WIN');setRating(4);
  buildEmotionGrids();
  ['htf','mtf','ltf'].forEach(clearSS);
  document.querySelectorAll('.trade-tag-btn').forEach(b => b.classList.remove('active'));
}

function closeAddTrade(){
  document.getElementById('add-trade-modal').classList.remove('open');
  document.body.style.overflow='';
}

document.getElementById('add-trade-modal').addEventListener('touchmove',function(e){
  if(e.target===this)e.preventDefault();
},{passive:false});

function setDir(d){
  state.formState.dir=d;
  document.getElementById('btn-buy').classList.toggle('active',d==='BUY');
  document.getElementById('btn-sell').classList.toggle('active',d==='SELL');
}

function setOutcome(o){
  state.formState.outcome=o;
  ['WIN','LOSS','BE'].forEach(x=>{
    const btn=document.getElementById('out-'+x);
    btn.className='outcome-btn outcome-btn-'+x.toLowerCase()+(o===x?' active':'');
  });
}

function setRating(n){
  state.formState.rating=n;
  document.querySelectorAll('.star-btn').forEach(s=>{
    s.classList.toggle('active',parseInt(s.dataset.n)<=n);
  });
}

function calcLive(){
  const e=parseFloat(document.getElementById('f-entry').value);
  const s=parseFloat(document.getElementById('f-sl').value);
  const t=parseFloat(document.getElementById('f-tp').value);
  const risk=parseFloat(document.getElementById('f-risk').value)||1;
  const riskAmt=(state.startingBalance||0)*risk/100;
  const pill=document.getElementById('calc-pill');
  if(e&&s&&t&&Math.abs(e-s)>0){
    const rRaw=Math.abs(t-e)/Math.abs(e-s);
    const r=state.formState.dir==='BUY'?(t>e?rRaw:-rRaw):(t<e?rRaw:-rRaw);
    document.getElementById('calc-r').textContent=(r>=0?'+':'')+r.toFixed(2)+'R';
    document.getElementById('calc-r').style.color=r>=1.5?'var(--green)':'var(--amber)';
    document.getElementById('calc-win').textContent='+$'+(riskAmt*Math.abs(rRaw)).toFixed(0);
    document.getElementById('calc-risk').textContent='$'+riskAmt.toFixed(0);
    pill.style.display='flex';
  } else {
    pill.style.display='none';
  }
}

let uploadIdCounter=0;

function triggerSSUpload(target){
  const uploadId=++uploadIdCounter;
  document.getElementById('ss-file-input').dataset.uploadId=uploadId;
  document.getElementById('ss-file-input').dataset.target=target;
  document.getElementById('ss-file-input').click();
}

function handleSSUpload(event){
  const file=event.target.files[0];
  const uploadId=event.target.dataset.uploadId;
  const target=event.target.dataset.target;
  if(!file||!target||!uploadId)return;
  const reader=new FileReader();
  reader.onload=function(e){
    if(event.target.dataset.uploadId!==uploadId)return;
    const dataUrl=e.target.result;
    state.formState.screenshots[target]=dataUrl;
    const frame=document.getElementById('ss-'+target);
    const oldImg=frame.querySelector('img');
    if(oldImg)oldImg.remove();
    const img=document.createElement('img');
    img.src=dataUrl;
    frame.insertBefore(img,frame.firstChild);
    frame.classList.add('has-img');
  };
  reader.readAsDataURL(file);
  event.target.value='';
}

function clearSS(target){
  state.formState.screenshots[target]=null;
  const frame=document.getElementById('ss-'+target);
  const img=frame.querySelector('img');
  if(img)img.remove();
  frame.classList.remove('has-img');
}

function saveTrade(){
  var pair=document.getElementById('f-pair').value;
  var entry=parseFloat(document.getElementById('f-entry').value)||0;
  var sl_v=parseFloat(document.getElementById('f-sl').value)||0;
  var tp_v=parseFloat(document.getElementById('f-tp').value)||0;
  var riskPct=parseFloat(document.getElementById('f-risk').value)||1;
  var session=document.getElementById('f-session').value;
  var setup=document.getElementById('f-setup').value;
  var notes=document.getElementById('f-notes').value;
  var r=parseFloat(document.getElementById('f-r').value)||0;
  var pnl=parseFloat(document.getElementById('f-pnl').value)||0;
  var riskAmt=(state.startingBalance||10000)*riskPct/100;
  if(entry&&sl_v&&tp_v&&!r){
    if(entry===sl_v){
      alert('Entry price cannot equal stop loss. Please adjust your values.');
      return;
    }
    var rawR=Math.abs(tp_v-entry)/Math.abs(entry-sl_v);
    r=state.formState.dir==='BUY'?(tp_v>entry?rawR:-rawR):(tp_v<entry?rawR:-rawR);
  }
  if(!pnl&&r) pnl=parseFloat((riskAmt*r).toFixed(0));
  if(state.formState.outcome==='LOSS'&&pnl>0) pnl=-pnl;
  if(state.formState.outcome==='LOSS'&&r>0) r=-r;
  if(state.formState.outcome==='WIN'&&pnl<0) pnl=Math.abs(pnl);
  if(state.formState.outcome==='WIN'&&r<0) r=Math.abs(r);
  if(state.formState.outcome==='BE'){pnl=0;r=0;}
  var dateInput=document.getElementById('f-date').value;
  var tradeDate;
  if(dateInput){
    var d=new Date(dateInput+'T12:00:00');
    tradeDate=MONTHS_SHORT[d.getMonth()]+' '+d.getDate();
  } else {
    var today=new Date();
    tradeDate=MONTHS_SHORT[today.getMonth()]+' '+today.getDate();
  }
  var ss=Object.assign({},state.formState.screenshots);
  var newTrade={
    id:'local_'+Date.now(),pair:pair,dir:state.formState.dir,
    entry:entry,sl:sl_v,tp:tp_v,riskPct:riskPct,session:session,
    date:tradeDate,
    outcome:state.formState.outcome,pnl:pnl,r:parseFloat(r.toFixed(1)),
    setup:setup,emotion:state.formState.emotion,rating:state.formState.rating,
    notes:notes,screenshots:ss,tags:state.formState.tags||[]
  };
  state.trades.unshift(newTrade);
  saveTradesToStorage();
  closeAddTrade();
  renderAll();
  saveTradeToSupabase(newTrade);
}

function toggleTag(btn, tag){
  btn.classList.toggle('active');
  if(!state.formState.tags) state.formState.tags = [];
  if(btn.classList.contains('active')){
    if(!state.formState.tags.includes(tag)) state.formState.tags.push(tag);
  } else {
    state.formState.tags = state.formState.tags.filter(t => t !== tag);
  }
}