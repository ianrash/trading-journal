// Analytics Charts Functions

function renderAnalyticsCharts(){
  const setupData=SETUPS.map(s=>{const ts=state.trades.filter(t=>t.setup===s);const ws=ts.filter(t=>t.outcome==='WIN');return{s,wr:ts.length?Math.round(ws.length/ts.length*100):0,n:ts.length};}).filter(x=>x.n>0);
  {const ctx=document.getElementById('setup-chart').getContext('2d');
  if(state.chartInstances.setup){state.chartInstances.setup.destroy();}
  state.chartInstances.setup=new Chart(ctx,{type:'bar',
    data:{labels:setupData.map(x=>x.s),datasets:[{data:setupData.map(x=>x.wr),
      backgroundColor:setupData.map(x=>x.wr>=70?'rgba(0,190,116,0.7)':x.wr>=50?'rgba(121,104,242,0.7)':'rgba(255,51,102,0.7)'),
      borderRadius:4,borderSkipped:false,barPercentage:0.6,categoryPercentage:0.7}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>c.raw+'%'}}},
      scales:{x:{grid:{display:false},ticks:{color:'#555572',font:{size:10}}},
        y:{grid:{color:'#191932'},ticks:{color:'#555572',font:{size:10},callback:v=>v+'%'},max:100}}}
  });}
  const allPairs = [...new Set(state.trades.map(t => t.pair).filter(p => p))];
  const pairData = allPairs.map(p => {
    const ts = state.trades.filter(t => t.pair === p);
    return { p, pnl: ts.reduce((s, t) => s + t.pnl, 0), n: ts.length };
  }).filter(x => x.n > 0).sort((a, b) => b.pnl - a.pnl);
  {const ctx=document.getElementById('pair-chart').getContext('2d');
  if(state.chartInstances.pair){state.chartInstances.pair.destroy();}
  state.chartInstances.pair=new Chart(ctx,{type:'bar',
    data:{labels:pairData.map(x=>x.p),datasets:[{data:pairData.map(x=>x.pnl),
      backgroundColor:pairData.map(x=>x.pnl>=0?'rgba(0,190,116,0.7)':'rgba(255,51,102,0.7)'),
      borderRadius:4,borderSkipped:false,barPercentage:0.6,categoryPercentage:0.7}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>'$'+c.raw.toFixed(0)}}},
      scales:{x:{grid:{display:false},ticks:{color:'#555572',font:{size:9}}},
        y:{grid:{color:'#191932'},ticks:{color:'#555572',font:{size:10},callback:v=>'$'+v}}}}
  });}
  const emData=EMOTIONS.map((e,i)=>{const ts=state.trades.filter(t=>t.emotion===e);const ws=ts.filter(t=>t.outcome==='WIN');return{e,wr:ts.length?Math.round(ws.length/ts.length*100):0,n:ts.length,col:EMOTION_COLORS[i]};}).filter(x=>x.n>0);
  {const ctx=document.getElementById('emotion-chart').getContext('2d');
  if(state.chartInstances.emotion){state.chartInstances.emotion.destroy();}
  state.chartInstances.emotion=new Chart(ctx,{type:'bar',
    data:{labels:emData.map(x=>EMOJIS[x.e]+' '+x.e),datasets:[{data:emData.map(x=>x.wr),backgroundColor:emData.map(x=>x.col+'BB'),borderRadius:4,borderSkipped:false,barPercentage:0.6,categoryPercentage:0.7}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw+'%'}}},
      scales:{x:{grid:{display:false},ticks:{color:'#555572',font:{size:9}}},y:{grid:{color:'#191932'},ticks:{color:'#555572',font:{size:10},callback:v=>v+'%'},max:100}}}
  });}
  const tbl=document.getElementById('setup-matrix');
  tbl.innerHTML=`<thead><tr>${['Setup','Trades','Win%','Avg R','P&L'].map(h=>`<th style="color:var(--muted);text-align:left;padding-bottom:8px;font-size:10px;letter-spacing:0.06em;font-weight:600;white-space:nowrap;">${h}</th>`).join('')}</tr></thead><tbody>`;
  const tbody=document.createElement('tbody');
  SETUPS.forEach(s=>{
    const ts=state.trades.filter(t=>t.setup===s);if(!ts.length)return;
    const ws=ts.filter(t=>t.outcome==='WIN');
    const wr=Math.round(ws.length/ts.length*100);
    const ar=(ts.reduce((a,t)=>a+t.r,0)/ts.length).toFixed(1);
    const pnl=ts.reduce((a,t)=>a+t.pnl,0);
    const row=document.createElement('tr');
    row.style.borderTop='1px solid var(--border)';
    row.innerHTML=`<td style="padding:8px 0;font-size:12px;color:var(--text);">${s}</td>
      <td style="color:var(--muted);font-family:'DM Mono',monospace;font-size:12px;">${ts.length}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:${wr>=70?'var(--green)':wr>=50?'var(--amber)':'var(--red)'};">${wr}%</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px;color:${ar>=0?'var(--green)':'var(--red)'};">${ar>=0?'+':''}${ar}R</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px;color:${pnl>=0?'var(--green)':'var(--red)'};">${fP(pnl)}</td>`;
    tbody.appendChild(row);
  });
  tbl.appendChild(tbody);
}