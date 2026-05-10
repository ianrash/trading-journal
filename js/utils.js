// Utility Functions

const fP = n => (n>=0?'+$':'-$')+Math.abs(n).toFixed(0);
const fR = r => (r>=0?'+':'')+parseFloat(r).toFixed(1)+'R';
const totalPnl = () => state.trades.reduce((s,t)=>s+t.pnl,0);
const wins = () => state.trades.filter(t=>t.outcome==='WIN');
const losses = () => state.trades.filter(t=>t.outcome==='LOSS');
const winRate = () => state.trades.length ? wins().length/state.trades.length*100 : 0;
const avgR = () => state.trades.length ? state.trades.reduce((s,t)=>s+t.r,0)/state.trades.length : 0;
const avgWinR = () => wins().length ? wins().reduce((s,t)=>s+t.r,0)/wins().length : 0;
const avgLossR = () => losses().length ? losses().reduce((s,t)=>s+Math.abs(t.r),0)/losses().length : 0;
const expectancy = () => {
  const wr=winRate()/100, awr=avgWinR(), alr=avgLossR();
  return (wr*awr)-((1-wr)*alr);
};
const profitFactor = () => {
  const gp=wins().reduce((s,t)=>s+t.pnl,0);
  const gl=losses().reduce((s,t)=>s+Math.abs(t.pnl),0);
  return gl>0?gp/gl:gp>0?99:0;
};
const getCurrentMonth = () => {
  const today = new Date();
  return MONTHS_SHORT[today.getMonth()] + ' ' + today.getFullYear();
};

const getMonthFilter = (monthStr) => {
  if(!monthStr || monthStr === 'all') return null;
  const parts = monthStr.split(' ');
  const monthNum = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11}[parts[0]];
  const year = parseInt(parts[1]);
  return { month: monthNum, year };
};

const violationCount = (monthFilter) => {
  if(!monthFilter) return state.rules.reduce((s,r) => s + (r.violations || 0), 0);
  return state.rules.reduce((s,r) => {
    const violations = r.violations || 0;
    const vArray = r.violationDates || [];
    const filtered = vArray.filter(v => {
      const vDate = new Date(v);
      return vDate.getMonth() === monthFilter.month && vDate.getFullYear() === monthFilter.year;
    });
    return s + (monthFilter ? filtered.length : violations);
  }, 0);
};

const disciplineScore = (monthFilter) => {
  const count = violationCount(monthFilter);
  return Math.max(0, Math.min(100, 100 - count * 7));
};
const edgeScore = () => {
  const wr=winRate()/100, ar=Math.min(avgR()/2.5,1), ds=disciplineScore()/100;
  return Math.round(wr*35+ar*35+ds*30);
};

const calculateStreak = () => {
  if (state.trades.length === 0) return 0;
  const tradeDays = {};
  state.trades.forEach(t => {
    if (!tradeDays[t.date]) tradeDays[t.date] = { wins: 0, losses: 0 };
    if (t.outcome === 'WIN') tradeDays[t.date].wins++;
    else if (t.outcome === 'LOSS') tradeDays[t.date].losses++;
  });
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
    if (tradeDays[key] && tradeDays[key].wins > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
};