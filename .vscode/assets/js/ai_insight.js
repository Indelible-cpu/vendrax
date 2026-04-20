Chart.defaults.animation = false;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;
Chart.defaults.plugins.legend.position = 'top';

let currentFetchController = null;
let activeSection = null;

async function refreshContent(section) {
  const contentArea = document.getElementById("contentArea");
  if (!contentArea) {
    console.warn("contentArea not found. Stopping refresh.");
    return;
  }

  try {
    if (currentFetchController) {
      currentFetchController.abort();
    }

    currentFetchController = new AbortController();

    const res = await fetch(
      `ajax/get_ai_content.php?section=${section}&include=all`,
      { signal: currentFetchController.signal }
    );

    const content = await res.json();
    if (activeSection !== section) return;

    if (!content.html) return;

    const isNewSection = !window.currentChartSection || window.currentChartSection !== section;

    let html = content.html;

    if (content.chart) {
      html += `
        <div class="chart-wrapper">
          <canvas id="${section}Chart"></canvas>
        </div>
      `;
    }

    if (isNewSection) {

      if (window.currentChart) {
        window.currentChart.destroy();
        window.currentChart = null;
      }

      contentArea.innerHTML = html;
      window.currentChartSection = section;

      if (content.chart) {

  requestAnimationFrame(() => {
    setTimeout(() => {

      const canvas = document.getElementById(section + "Chart");
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      window.currentChart = new Chart(ctx, {
        ...content.chart,
        options: {
          ...content.chart.options,
          animation: { duration: 600, easing: 'easeOutQuart' },
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  const val = context.raw || 0;
                  const label = context.dataset.label || '';
                  const date = context.label || '';
                  return `${label} on ${date}: MWK ${val.toLocaleString()}`;
                }
              }
            },
            legend: content.chart.options?.plugins?.legend || { position: 'top' }
          },
          maintainAspectRatio: false,
          responsive: true
        }
      });

      // 🔥 critical mobile fix
      setTimeout(() => {
        if (window.currentChart) {
          window.currentChart.resize();
        }
      }, 100);

    }, 60);
  });

}
    } else {

      if (window.currentChart) {
  if (content.chart) {
    window.currentChart.data = content.chart.data;
    window.currentChart.update();

    // 🔥 ensure proper mobile scaling after data refresh
    setTimeout(() => {
      window.currentChart.resize();
    }, 50);
        } else {
          window.currentChart.destroy();
          window.currentChart = null;
          contentArea.innerHTML = content.html;
        }
      }
    }

  } catch (err) {
    if (err.name === 'AbortError') return;

    console.error("Error loading " + section + " content:", err);

    if (contentArea) {
      contentArea.innerHTML =
        "<div class='alert alert-danger'>Failed to load data.</div>";
    }
  }
}

function loadSection(section) {
  activeSection = section;
  localStorage.setItem('aiInsightActiveSection', section);
  document.querySelectorAll('.card-clickable')
    .forEach(c => c.classList.remove('active'));

  const activeCard = document.querySelector(
    `.card-clickable[data-section="${section}"]`
  );
  if (activeCard) activeCard.classList.add('active');

  if (window.refreshTimer) {
    clearInterval(window.refreshTimer);
    window.refreshTimer = null;
  }

  const contentArea = document.getElementById("contentArea");
  if (contentArea) {
    contentArea.innerHTML = "<div class='text-center p-4'>Loading...</div>";
  }

  refreshContent(section);

  window.refreshTimer = setInterval(() => {
    if (activeSection !== section) return;
    refreshContent(section);
  }, 60000);
}

document.addEventListener('click', function (e) {
  const card = e.target.closest('.card-clickable');
  if (!card) return;

  e.preventDefault();
  e.stopPropagation();

  const section = card.getAttribute('data-section');
  if (section) {
    loadSection(section);
  }
});


/* ================== PRODUCTION SAFE KEYBOARD NAV ================== */

document.addEventListener('keydown', function (e) {

  /* ---- Ignore typing inside inputs / textarea / contenteditable ---- */
  const tag = document.activeElement?.tagName;
  const isTyping =
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    document.activeElement?.isContentEditable;

  if (isTyping) return;

  const cards = Array.from(document.querySelectorAll('.card-clickable'));
  if (!cards.length) return;

  let currentIndex = cards.findIndex(card =>
    card.classList.contains('active')
  );

  // If none active, default to first
  if (currentIndex === -1) currentIndex = 0;

  /* ---------- CTRL + S (Soft Refresh Current Section) ---------- */
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    e.stopPropagation();

    if (activeSection) {
      refreshContent(activeSection);
    }
    return;
  }

  /* ---------- Arrow Navigation ---------- */
  if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();

    let newIndex = currentIndex;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      newIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
    }

    const newCard = cards[newIndex];
    if (!newCard) return;

    const section = newCard.getAttribute('data-section');
    if (!section) return;

    // Update visual focus for accessibility
    newCard.focus();

    loadSection(section);
    return;
  }

  /* ---------- Enter / Space ---------- */
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();

    const activeCard = cards[currentIndex];
    if (!activeCard) return;

    const section = activeCard.getAttribute('data-section');
    if (!section) return;

    loadSection(section);
  }

});
function initAiInsightPage() {
  const cards = document.querySelectorAll('.card-clickable');
  if (!cards.length) return;

 const savedSection = localStorage.getItem('aiInsightActiveSection');

let defaultCard =
  Array.from(cards).find(card =>
    card.getAttribute('data-section') === savedSection
  );

if (!defaultCard) {
  defaultCard =
    Array.from(cards).find(card =>
      card.getAttribute('data-section') === 'predictions'
    ) || cards[0];
}
  const section = defaultCard.getAttribute('data-section');
  // ensure visual highlight before loading
cards.forEach(c => c.classList.remove('active'));
defaultCard.classList.add('active');
  if (section) loadSection(section);
}

/* ===== Force Chart Resize on Window Resize ===== */
window.addEventListener('resize', function () {
  if (window.currentChart) {
    window.currentChart.resize();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  initAiInsightPage();
});

const aiCardObserver = new MutationObserver(() => {

  const savedSection = localStorage.getItem('aiInsightActiveSection');
  if (!savedSection) return;

  const cards = document.querySelectorAll('.card-clickable');
  if (!cards.length) return;

  if (document.querySelector('.card-clickable.active')) return;

  const activeCard = document.querySelector(
    `.card-clickable[data-section="${savedSection}"]`
  );

  if (activeCard) {
    cards.forEach(c => c.classList.remove('active'));
    activeCard.classList.add('active');
  }

});

aiCardObserver.observe(document.body, {
  childList: true,
  subtree: true
});
