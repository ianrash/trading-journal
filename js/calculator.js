// Risk Calculator Functions

function calcRisk(){
  const balance = parseFloat(document.getElementById('calc-balance').value) || 10000;
  const riskPct = parseFloat(document.getElementById('calc-risk-pct').value) || 1;
  const entry = parseFloat(document.getElementById('calc-entry').value);
  const sl = parseFloat(document.getElementById('calc-sl').value);
  
  const riskAmt = balance * (riskPct / 100);
  document.getElementById('calc-risk-amt').textContent = '$' + riskAmt.toFixed(0);
  
  if(entry && sl && Math.abs(entry - sl) > 0){
    const pair = document.getElementById('calc-pair').value || '';
    const isJPY = pair.includes('JPY');
    const pips = Math.abs(entry - sl);
    const pipDivisor = isJPY ? 0.01 : 0.0001;
    const pipsCount = pips / pipDivisor;
    const lots = riskAmt / (pipsCount * 10);
    
    document.getElementById('calc-lots').textContent = lots.toFixed(2) + ' lots';
    document.getElementById('calc-pips').textContent = pipsCount.toFixed(1);
  } else {
    document.getElementById('calc-lots').textContent = '--';
    document.getElementById('calc-pips').textContent = '--';
  }
}