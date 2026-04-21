(function(){

  if (window.salesSummaryScriptLoaded) {
    console.warn("sales_summary.js already loaded");
    return;
  }

  window.salesSummaryScriptLoaded = true;
const apiBase = '/backend/sales_summary_api.php';

const exportBase = location.origin + '/pages/export_sales_summary.php';
let container;
let detailView;
let detailTitle;
let detailSummary;
let chartCanvas;
let helpOverlay;
let historyScopeSelect;
let chartRequestId = 0;
let activeChart = null;
let activeIndex = 0;
let activeScope = 'daily';
window.getActiveScope = () => activeScope || 'daily';

const scopes = [
  { key:'daily',   label:'Daily sales',   icon:'bi-calendar-day',   range:'Last 24 hours',  colorClass:'card-daily' },
  { key:'weekly',  label:'Weekly sales',  icon:'bi-calendar-week',  range:'Last 7 days',   colorClass:'card-weekly' },
  { key:'monthly', label:'Monthly sales', icon:'bi-calendar-month', range:'Last 30 days',  colorClass:'card-monthly' },
  { key:'yearly',  label:'Annual sales',  icon:'bi-calendar3',      range:'Last 365 days', colorClass:'card-yearly' }
];

function toast(msg){
 const t = document.createElement('div');
 t.className = 'toast-message';
 t.textContent = msg;
 document.body.appendChild(t);
 setTimeout(()=>t.classList.add('show'), 100);
 setTimeout(()=>{ t.classList.remove('show'); t.remove(); }, 3000);
}

function renderCard(s, index){
  const col = document.createElement('div');
  col.className = 'col-12 col-sm-6 col-md-6 col-xl-3';

  col.innerHTML = `
    <div class="card summary-card ${s.colorClass}" data-scope="${s.key}" tabindex="0" role="button">
      <div class="card-body">
        <i class="bi ${s.icon}"></i>
        <div class="card-text d-flex align-items-center gap-1">
          <span class="fw-semibold">${s.label}</span>
          <span class="small text-white-50">• ${s.range}</span>
        </div>
      </div>
    </div>
  `;

  const card = col.querySelector('.summary-card');

  card.addEventListener('click', () => {
    activeIndex = index;
    setActiveCard(activeIndex);
    openDetail(s, card);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  container.appendChild(col);
}

// ===== POPULATE HISTORY DROPDOWN =====
function populateHistoryDropdown(scope){
  if(!historyScopeSelect) return;
  historyScopeSelect.innerHTML = '';
  const today = new Date();
  let options = [];

  if(scope==='daily'){
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    for(let d=new Date(today); d>=firstDay; d.setDate(d.getDate()-1)){
      const label = d.toLocaleDateString('en-GB');
      options.push({value: label, text: label});
    }
  } else if(scope==='weekly'){
    const getWeekNumber = d => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate()+4-dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      return Math.ceil((((d-yearStart)/86400000)+1)/7);
    };
    let current = new Date(today);
    for(let i=0; i<4; i++){
      const w = getWeekNumber(current);
      const m = current.toLocaleString('default',{month:'long'});
      const y = current.getFullYear();
      options.push({value:`${y}-W${w}`, text:`Week ${w}, ${m} ${y}`});
      current.setDate(current.getDate()-7);
    }
  } else if(scope==='monthly'){
    let current = new Date(today.getFullYear(), today.getMonth(),1);
    for(let i=0; i<12; i++){
      const m = current.toLocaleString('default',{month:'long'});
      const y = current.getFullYear();
      options.push({value:`${m}-${y}`, text:`${m} ${y}`});
      current.setMonth(current.getMonth()-1);
    }
  } else if(scope==='yearly'){
    const currentYear = today.getFullYear();
    for(let i=0; i<4; i++){
      const y = currentYear-i;
      options.push({value:`year-${y}`, text:`${y}`});
    }
  }

  options.forEach(opt=>{
    const el = document.createElement('option');
    el.value = opt.value;
    el.text = opt.text;
    historyScopeSelect.appendChild(el);
  });
  historyScopeSelect.selectedIndex = 0;
}

// ===== DETAIL FUNCTIONS =====
function openDetail(s, card){

if (window.innerWidth <= 768) {
  detailView.scrollIntoView({ behavior: 'smooth', block: 'start' });
}



  document.querySelectorAll('.summary-card').forEach(c=>c.classList.remove('active'));
  card.classList.add('active');

  activeScope = s.key;
  detailView.classList.add('open');
  detailTitle.textContent = s.label+' summary';

  ['totalSales','totalProfit','totalTransactions']
    .forEach(id=>document.getElementById(id).textContent='Loading...');

  if(activeChart){
  activeChart.destroy();
  activeChart = null;
}

populateHistoryDropdown(s.key);
loadSummary(s.key);
loadChart(s.key);
}
 window.backToSummary = function(){
  detailView.classList.remove('open');
  if(activeChart){
    activeChart.destroy();
    activeChart = null;
  }
};

// ===== EXPORT =====
window.downloadFile = function(scope, fmt){
  const allowed = ['daily','weekly','monthly','yearly'];
  if(!allowed.includes(scope)){ toast('Invalid scope selected'); return; }
  toast(`Downloading ${fmt.toUpperCase()} (${scope})...`);
  const f = document.createElement('iframe');
  f.style.display='none';
  const period = historyScopeSelect?.value || null;
  f.src = `${exportBase}?scope=${scope}&period=${period}&format=${fmt}`;
  document.body.appendChild(f);
  setTimeout(()=>f.remove(),20000);
};

// ===== SUMMARY & CHART =====
function loadSummary(scope){
  const period = historyScopeSelect?.value || null;
  fetch(`${apiBase}?scope=${scope}&type=summary&period=${period}`)
    .then(r=>r.json())
    .then(res=>{
      const s = res.summary || {};
      document.getElementById('totalSales').textContent = `MWK ${Number(s.total_sales||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
      document.getElementById('totalProfit').textContent = `MWK ${Number(s.total_profit||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
      document.getElementById('totalTransactions').textContent = s.transactions_count||0;

      // Margin metric
      let existingMargin = document.getElementById('totalMargin');
      if(!existingMargin){
        existingMargin = document.createElement('div');
        existingMargin.className = 'metric-inline';
        existingMargin.id = 'totalMargin';
        existingMargin.innerHTML = `<span class="fw-bold">Margin:</span> <span>0%</span>`;
        detailSummary.appendChild(existingMargin);
      }
      existingMargin.querySelector('span:last-child').textContent = `${s.margin_percent||0}%`;
    })
    .catch(err=>{
      ['totalSales','totalProfit','totalTransactions'].forEach(id=>document.getElementById(id).textContent='Error');
      console.error(err);
    });
}

function loadChart(scope){
  const period = historyScopeSelect?.value || null;

  const requestId = ++chartRequestId;   // ✅ ADD THIS

  fetch(`${apiBase}?scope=${scope}&type=chart&period=${period}`)
    .then(r => r.json())
    .then(res => {

 if (requestId !== chartRequestId) return;

  if (!res || !Array.isArray(res.labels)) {
    toast('Invalid chart data');
    return;
  }

  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }
  const sales = Array.isArray(res.sales)
    ? res.sales.map(v => isNaN(parseFloat(v)) ? 0 : parseFloat(v))
    : [];

  const profits = Array.isArray(res.profits)
    ? res.profits.map(v => isNaN(parseFloat(v)) ? 0 : parseFloat(v))
    : [];

  const margin = Array.isArray(res.margin_percent)
    ? res.margin_percent.map(v => isNaN(parseFloat(v)) ? 0 : parseFloat(v))
    : [];

      activeChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels: res.labels,
          datasets: [
            {
              label: 'Sales (MWK)',
              data: sales,
              backgroundColor:'rgba(75,192,192,0.7)',
              yAxisID: 'yMWK'
            },
            {
              label: 'Profit (MWK)',
              data: profits,
              backgroundColor: profits.map(v => v >= 0 ? 'rgba(40,167,69,0.7)' : 'rgba(220,53,69,0.7)'),
              yAxisID: 'yMWK'
            },
            {
              label: 'Margin (%)',
              data: margin,
              type:'line',
              borderColor:'rgba(255,193,7,1)',
              backgroundColor:'rgba(255,193,7,0.2)',
              yAxisID:'yMargin',
              tension:0.2,
              fill:false,
              pointRadius:4,
              pointHoverRadius:6
            }
          ]
        },
        options: {
          responsive:true,
          maintainAspectRatio:false,
          interaction: { mode:'index', intersect:false },
          stacked:false,
          plugins:{
            tooltip:{
              callbacks:{
                label: function(ctx) {
  if (ctx.dataset.label === 'Margin (%)') {
    const val = ctx.raw ?? 0;
    return `${ctx.dataset.label}: ${val.toFixed(2)}%`;
  } else {
    const val = ctx.raw ?? 0;
    return `${ctx.dataset.label}: MWK ${val.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  }

}
              
  }          },
            legend:{ position:'top' }
          },
          scales:{
            yMWK:{
              type:'linear',
              display:true,
              position:'left',
              beginAtZero:true,
              title:{ display:true, text:'MWK' }
            },
            yMargin:{
              type:'linear',
              display:true,
              position:'right',
              beginAtZero:true,
              max:100,
              ticks:{ callback: v => v + '%' },
              grid:{ drawOnChartArea:false },
              title:{ display:true, text:'Margin %' }
            }
          }
        }
      });
    })
    .catch(err=>{ toast('Failed to load chart'); console.error(err); });
}

// ===== KEYBOARD SHORTCUTS =====
function setActiveCard(index){
  const cards = [...document.querySelectorAll('.summary-card')];
  cards.forEach(c => c.classList.remove('active'));
  cards[index]?.classList.add('active');
}


// ===== MOBILE SWIPE SUPPORT =====
// ===== MOBILE SWIPE SUPPORT (Improved) =====
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleSwipe() {
  const cards = [...document.querySelectorAll('.summary-card')];
  if (!cards.length) return;

  const threshold = 60;
  const verticalLimit = 40;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaY) > verticalLimit) return;

  if (deltaX < -threshold) {
    activeIndex = (activeIndex + 1) % cards.length;
    setActiveCard(activeIndex);
    cards[activeIndex]?.click();
  }

  if (deltaX > threshold) {
    activeIndex = (activeIndex - 1 + cards.length) % cards.length;
    setActiveCard(activeIndex);
    cards[activeIndex]?.click();
  }
}
function createSalesSummaryComponent() {

  let mounted = false;
  let keydownHandler = null;
  let handleTouchStart = null;
  let handleTouchEnd = null;

  function mount() {
    if (mounted) return;
    mounted = true;

    container = document.getElementById('summaryRow');
    detailView = document.getElementById('detailView');
    detailTitle = document.getElementById('detailTitle');
    detailSummary = document.getElementById('detailSummary');
    chartCanvas = document.getElementById('chartCanvas');
    helpOverlay = document.getElementById('shortcutHelp');
    historyScopeSelect = document.getElementById('historyScope');

    if (!container) {
      mounted = false;
      requestAnimationFrame(mount);
      return;
    }

    container.innerHTML = '';
    scopes.forEach((scope, i) => renderCard(scope, i));

    bindSwipe();
    bindKeyboard();

    if (window.innerWidth > 768) {
      const first = document.querySelector('.summary-card');
      if (first) first.click();
    }
  }

  function unmount() {
    if (!mounted) return;
    mounted = false;

    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }

    if (container) {
      if (handleTouchStart) container.removeEventListener('touchstart', handleTouchStart);
      if (handleTouchEnd) container.removeEventListener('touchend', handleTouchEnd);
      handleTouchStart = null;
      handleTouchEnd = null;

      container.innerHTML = '';
    }

    if (activeChart) {
      activeChart.destroy();
      activeChart = null;
    }
  }

  function bindKeyboard() {
    keydownHandler = function(e) {
      const cards = [...document.querySelectorAll('.summary-card')];

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (!cards.length) return;

        activeIndex = (e.key === 'ArrowRight')
          ? (activeIndex + 1) % cards.length
          : (activeIndex - 1 + cards.length) % cards.length;

        setActiveCard(activeIndex);
        cards[activeIndex]?.click();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        cards[activeIndex]?.click();
        return;
      }
    };

    document.addEventListener('keydown', keydownHandler);
  }

  function bindSwipe() {
    if (!container) return;

    handleTouchStart = e => {
      if (window.innerWidth > 768) return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    handleTouchEnd = e => {
      if (window.innerWidth > 768) return;
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  return { mount, unmount };
}

const SalesSummaryComponent = createSalesSummaryComponent();

  // auto-run if directly loaded
  if (location.hash === "#sales-summary") {
  SalesSummaryComponent.mount();
}

})();