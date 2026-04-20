
window.TransactionsPage = (function () {

let currentTransactionId = null;
let currentPreviewType = 'receipt';
let ignoreNextOutsideClick = false;
// ===== permissions + table column span =====
const canEdit = window.canEdit || false;
const colspan = canEdit ? 15 : 12; // adjust number if your table differs

function updatePreview() {
  if (!currentTransactionId) return;

  const container = document.getElementById('previewContainer');
  let url = '/print_receipt.php?id=' + currentTransactionId;

  if (currentPreviewType === 'invoice') {
    url = '/print_invoice.php?id=' + currentTransactionId;
  }

  container.innerHTML =
    '<iframe src="' + url + '" style="width:100%;height:calc(100vh - 52px);border:none"></iframe>';
}

function setActivePreviewButtons() {
  document.getElementById('btnReceipt').className =
    currentPreviewType === 'receipt'
      ? 'btn btn-sm btn-primary'
      : 'btn btn-sm btn-outline-primary';

  document.getElementById('btnInvoice').className =
    currentPreviewType === 'invoice'
      ? 'btn btn-sm btn-primary'
      : 'btn btn-sm btn-outline-primary';
}

function openTransactionPreview(id) {
  if (!window.transactionsPageActive) return;

  currentTransactionId = id;
  currentPreviewType = 'receipt';

  setActivePreviewButtons();
  updatePreview();

  const dock = document.getElementById('previewDock');

  ignoreNextOutsideClick = true;
  dock.style.display = 'block';

  setTimeout(() => ignoreNextOutsideClick = false, 350);
}
// ---------- close preview when clicking outside ----------
document.addEventListener('click', (e) => {
  if (!window.transactionsPageActive) return;

  const dock = document.getElementById('previewDock');
  if (!dock || dock.style.display === 'none') return;

  if (ignoreNextOutsideClick) return;

  if (!dock.contains(e.target)) {
    dock.style.display = 'none';
    currentTransactionId = null;
  }
});
/*  
showDeleted values:
  '0'      → active only
  'trash'  → deleted only
*/
let showDeleted = '0';
let lastDeletedIds = [];

// ===== Pagination state =====
let currentPage = 1;
const pageSize = 15;

// ===== Pagination label updater =====
function updatePageLabel() {
  const label = document.getElementById('currentPageLabel');
  if (label) {
    label.textContent = currentPage;
  }
}

/* ===== Pagination buttons (bind ONCE) ===== */
document.getElementById('prevPage')?.addEventListener('click', () => {
  const prevBtn = document.getElementById('prevPage');
  if (prevBtn.disabled) return;

  currentPage--;
  updatePageLabel();
  loadTransactions();
});

document.getElementById('nextPage')?.addEventListener('click', () => {
  const nextBtn = document.getElementById('nextPage');
  if (nextBtn.disabled) return;

  currentPage++;
  updatePageLabel();
  loadTransactions();
});



/* ---------- Trash UI state ---------- */
function updateTrashUI() {
  const backBtn  = document.getElementById('backToActive');
  const trashBtn = document.getElementById('openTrash');

  if (showDeleted === 'trash') {
    backBtn?.classList.remove('d-none');
    trashBtn?.classList.add('btn-warning');
    trashBtn?.classList.remove('btn-outline-warning');
  } else {
    backBtn?.classList.add('d-none');
    trashBtn?.classList.remove('btn-warning');
    trashBtn?.classList.add('btn-outline-warning');
  }
}
/* ---------- Trash / Back buttons ---------- */
document.getElementById('openTrash')?.addEventListener('click', () => {
  showDeleted = (showDeleted === 'trash') ? '0' : 'trash';
  updateTrashUI();
  resetAndLoad(); // ✅ CORRECT
});

document.getElementById('backToActive')?.addEventListener('click', () => {
  showDeleted = '0';
  updateTrashUI();
  resetAndLoad();

});


/* ---------------- helper: unified confirm modal ---------------- */
function showConfirm(msg, onConfirm) {
  const msgEl = document.getElementById('confirmModalMsg');
  const yesBtn = document.getElementById('confirmModalYes');
  const modalEl = document.getElementById('confirmModal');
  if (!msgEl || !yesBtn || !modalEl) {
    console.warn('Confirm modal elements missing');
    return;
  }
  msgEl.textContent = msg || 'Are you sure?';
  const modal = new bootstrap.Modal(modalEl);
  // clear previous handler
  yesBtn.onclick = () => {
    modal.hide();
    if (typeof onConfirm === 'function') {
      try { onConfirm(); } catch (err) { console.error(err); }
    }
  };
  modal.show();
}

function setToastType(type) {
  const toastEl = document.getElementById('actionToast');
  if (!toastEl) return;

  toastEl.classList.remove(
    'bg-success',
    'bg-danger',
    'bg-secondary',
    'text-white'
  );

  if (type === 'success') {
    toastEl.classList.add('bg-success', 'text-white');
  } else if (type === 'error') {
    toastEl.classList.add('bg-danger', 'text-white');
  } else {
    toastEl.classList.add('bg-secondary', 'text-white');
  }
}

function showToast(message, type = 'success') {
  const toastEl = document.getElementById('actionToast');
  const toastMsg = document.getElementById('actionToastMsg');

  if (!toastEl || !toastMsg) return;

  setToastType(type);

  toastMsg.textContent = message;

  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
}


 function showUndoToast(message) {
  const toastEl = document.getElementById('actionToast');
  const toastMsg = document.getElementById('actionToastMsg');

  if (!toastEl || !toastMsg) return;

  // neutral color for undo
  setToastType('neutral');

  // clear previous toast content
  toastMsg.innerHTML = '';

  const textSpan = document.createElement('span');
  textSpan.textContent = message;

  const undoBtn = document.createElement('button');
  undoBtn.className = 'btn btn-sm btn-light ms-2';
  undoBtn.textContent = 'Undo';

  toastMsg.appendChild(textSpan);
  toastMsg.appendChild(undoBtn);

  const toast = new bootstrap.Toast(toastEl, { delay: 6000 });
  toast.show();

  undoBtn.addEventListener('click', async () => {
    if (!lastDeletedIds.length) return;

    const fd = new FormData();
    fd.append('action', 'restore');
    lastDeletedIds.forEach(id => fd.append('ids[]', id));

    try {
      const res = await fetch('/backend/transaction_action.php', {
  credentials: 'include',
 
        method: 'POST',
        body: fd
      });

      const data = await res.json();

      if (data.success) {
        showToast('Transaction(s) restored', 'success');
        loadTransactions();
        lastDeletedIds = [];
      } else {
        showToast(data.message || 'Restore failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Restore failed', 'error');
    }
  });
}

/* ---------------- bind row actions (view / edit) ---------------- */
function bindActions() {
  /* -------- VIEW (Preview Dock) -------- */
  document.querySelectorAll('.action-view').forEach(btn => {
    if (btn.dataset.boundView) return;
    btn.dataset.boundView = "1";

    btn.addEventListener('click', (e) => {
      if (!window.transactionsPageActive) return;

      e.preventDefault();
      e.stopPropagation();

      const id = btn.dataset.id;
      if (!id) return;

      openTransactionPreview(id);
    });
  });

document.querySelectorAll('.action-purge').forEach(btn => {
  if (btn.dataset.boundPurge) return;
  btn.dataset.boundPurge = '1';

  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    showConfirm('Permanently delete this transaction? This cannot be undone.', async () => {
      const fd = new FormData();
      fd.append('action','purge');
      fd.append('ids[]', id);

const res = await fetch('/backend/transaction_action.php', {
  credentials: 'include',
  method: 'POST',
  body: fd
});
     
const data = await res.json();
      showToast(data.message || 'Transaction permanently removed');
      loadTransactions();
    });
  });
});
/* -------- RESTORE (row-level) -------- */
document.querySelectorAll('.action-restore').forEach(btn => {
  if (btn.dataset.boundRestore) return;
  btn.dataset.boundRestore = '1';

  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    if (!id) return;

    showConfirm('Restore this transaction?', async () => {
      const fd = new FormData();
      fd.append('action', 'restore');
      fd.append('ids[]', id);

      try {
        const res = await fetch('/backend/transaction_action.php', {
  credentials: 'include',
 
          method: 'POST',
          body: fd
        });
        const data = await res.json();

        if (data.success) {
          showToast('Transaction restored');
          loadTransactions();
        } else {
          showToast(data.message || 'Restore failed');
        }
      } catch (err) {
        console.error(err);
        showToast('Restore failed');
      }
    });
  });
});

  
 /* -------- DELETE (trash icon) -------- */
document.querySelectorAll('.action-delete').forEach(btn => {
  if (btn.dataset.boundDelete) return;
  btn.dataset.boundDelete = '1';

  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    if (!id) {
      console.warn('Delete clicked without id');
      return;
    }

    showConfirm('Delete this transaction?', async () => {
      const fd = new FormData();
      fd.append('action', showDeleted === 'trash' ? 'purge' : 'delete');

      fd.append('ids[]', id);

      try {
        const res = await fetch('/backend/transaction_action.php', {
  credentials: 'include',
 
          method: 'POST',
          body: fd
        });

        const data = await res.json();
        showToast(
          data.message ||
          (data.success ? 'Transaction deleted successfully!' : 'Delete failed')
        );

        if (data.success) {
          lastDeletedIds = [id];
          showUndoToast('Transaction deleted');
          loadTransactions();
        }

      } catch (err) {
        console.error(err);
        showToast('Delete failed. Please try again.');
      }
    });
  });
});
}

/* ---------------- post-load setup: checkboxes, top buttons ---------------- */
function postLoadSetup() {

  if (!canEdit) return;

  /* -------- inject checkboxes -------- */
  const rows = document.querySelectorAll('#transactionsBody tr');
  rows.forEach(row => {
    if (row.querySelectorAll('td').length === 0) return;
    if (row.querySelector('.row-select')) return;

    let id = row.dataset?.id || row.querySelector('td')?.innerText.trim().split(/\s+/)[0] || '';
    const td = document.createElement('td');
    td.style.textAlign = 'center';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'row-select';
    cb.value = id;

    td.appendChild(cb);
    row.insertBefore(td, row.firstChild);
  });

  /* -------- select all -------- */
  const selectAllHeader = document.getElementById('selectAllHeader');
  if (selectAllHeader && !selectAllHeader.dataset.tied) {
    selectAllHeader.addEventListener('change', function () {
      document.querySelectorAll('.row-select').forEach(cb => cb.checked = this.checked);
    });
    selectAllHeader.dataset.tied = "1";
  }
 
  /* -------- RESTORE SELECTED (Trash) -------- */
  const restoreSelectedBtn = document.getElementById('restoreSelected');
  if (restoreSelectedBtn && !restoreSelectedBtn.dataset.bound) {
    restoreSelectedBtn.addEventListener('click', async () => {
      const ids = Array.from(document.querySelectorAll('.row-select:checked'))
        .map(cb => cb.value)
        .filter(Boolean);

      if (!ids.length) return showToast('Select at least one transaction');

      const fd = new FormData();
      fd.append('action', 'restore');
      ids.forEach(id => fd.append('ids[]', id));

      try {
        const res = await fetch('/backend/transaction_action.php', {
  credentials: 'include',
  method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
          showToast('Transaction(s) restored');
          loadTransactions();
        } else showToast(data.message || 'Restore failed');
      } catch (e) {
        console.error(e);
        showToast('Restore failed');
      }
    });
    restoreSelectedBtn.dataset.bound = "1";
  }

 /* -------- DELETE SELECTED -------- */
const deleteSelectedBtn = document.getElementById('deleteSelected');
if (deleteSelectedBtn && !deleteSelectedBtn.dataset.bound) {
  deleteSelectedBtn.addEventListener('click', () => {

    const ids = Array.from(document.querySelectorAll('.row-select:checked'))
      .map(cb => cb.value)
      .filter(Boolean);

    if (!ids.length) {
      showToast('Select at least one transaction');
      return;
    }

    const isTrash = document
      .getElementById('openTrash')
      ?.classList.contains('btn-warning');

    const action = isTrash ? 'purge' : 'delete';
    const msg = isTrash
      ? 'Permanently delete selected transaction(s)? This cannot be undone.'
      : 'Delete selected transaction(s)?';

    showConfirm(msg, async () => {
      const fd = new FormData();
      fd.append('action', action);
      ids.forEach(id => fd.append('ids[]', id));

      try {
        const res = await fetch('/backend/transaction_action.php', {
  credentials: 'include',

          method: 'POST',
          body: fd
        });

        const data = await res.json();
        showToast(data.message || 'Action completed');

        if (data.success) {
          loadTransactions();
        }

      } catch (e) {
        console.error(e);
        showToast('Delete failed');
      }
    });
  });

  deleteSelectedBtn.dataset.bound = "1";
}

}

/* ---------------- loading transactions via AJAX ---------------- */
async function loadTransactions() {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  const q = document.getElementById('searchBox').value.trim();
  const tbody = document.getElementById('transactionsBody');

  // ✅ Show loading immediately
  tbody.innerHTML = "";
  const loadingRow = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = colspan;
  td.className = "text-center text-muted small";
  td.textContent = "Loading...";
  loadingRow.appendChild(td);
  tbody.appendChild(loadingRow);

  // allow browser to render before fetch
  await new Promise(r => setTimeout(r, 10));

  try {
    const start = (currentPage - 1) * pageSize;

const res = await fetch(
  "/backend/transactions_data.php?from=" + encodeURIComponent(from) +
  "&to=" + encodeURIComponent(to) +
  "&q=" + encodeURIComponent(q) +
  "&showDeleted=" + showDeleted +
  "&start=" + start +
  "&length=" + pageSize,
  { credentials: 'include' }
);


   const html = await res.text();

if (html.trim() === 'SESSION_EXPIRED') {
  alert('Session expired. Please log in again.');
  window.location.href = '/login.php';
  return;
}

tbody.innerHTML = html;
/* ===== Pagination button state ===== */
const rowsLoaded = document.querySelectorAll('#transactionsBody tr[data-id]').length;

const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');

if (prevBtn) {
  prevBtn.disabled = currentPage === 1;
}

if (nextBtn) {
  nextBtn.disabled = rowsLoaded < pageSize;
}

   /* ---------- ✅ Trash badge updater (SAFE) ---------- */
    const firstRow = document.querySelector('#transactionsBody tr');
    const badge = document.getElementById('trashBadge');

    if (firstRow && badge && firstRow.dataset.trashCount !== undefined) {
      const count = parseInt(firstRow.dataset.trashCount, 10) || 0;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

  } catch (err) {
    console.error(err);
    document.getElementById('transactionsBody').innerHTML =
      "<tr><td colspan='"+colspan+"' class='text-center text-danger small'>Error loading transactions</td></tr>";
  }

  postLoadSetup();
  bindActions();
  selectedRowIndex = -1;
}


/* print button handler */
// ---------- print from preview dock ----------
document.getElementById('btnPrintPreview')?.addEventListener('click', () => {
  const iframe = document.querySelector('#previewContainer iframe');

  if (!iframe) {
    showToast('Nothing to print', 'error');
    return;
  }

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
});


let selectedRowIndex = -1;

function highlightRow() {
  const rows = document.querySelectorAll('#transactionsBody tr[data-id]');
  if (!rows.length) return;

  rows.forEach((row, idx) => {
    row.classList.toggle('active-row', idx === selectedRowIndex);
  });

  if (selectedRowIndex >= 0 && rows[selectedRowIndex]) {
    rows[selectedRowIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

document.addEventListener('keydown', (e) => {
  const rows = document.querySelectorAll('#transactionsBody tr[data-id]');
  if (!rows.length) return;

  // Arrow Down
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedRowIndex = Math.min(selectedRowIndex + 1, rows.length - 1);
    highlightRow();
  }

  // Arrow Up
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedRowIndex = Math.max(selectedRowIndex - 1, 0);
    highlightRow();
  }

  // Enter key → click first button in row
  if (e.key === 'Enter' && selectedRowIndex >= 0) {
    const row = rows[selectedRowIndex];
    const viewBtn = row.querySelector('.action-view');
    if (viewBtn) viewBtn.click();
  }

  // Escape → deselect
  if (e.key === 'Escape' && selectedRowIndex >= 0) {
    rows[selectedRowIndex].classList.remove('active-row');
    selectedRowIndex = -1;
  }
});

/* ---------------- export handlers ---------------- */
/* ---------------- export handlers (checkbox-aware) ---------------- */
async function downloadFile(type) {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  const q = document.getElementById('searchBox').value.trim();

  // get selected row IDs (if any)
  const selectedIds = Array.from(document.querySelectorAll('.row-select:checked'))
    .map(cb => cb.value)
    .filter(Boolean);

  // build URL
 let url = "/pages/export_transactions.php?type=" + type +
            "&from=" + encodeURIComponent(from) +
            "&to=" + encodeURIComponent(to) +
            "&q=" + encodeURIComponent(q);

  if (selectedIds.length > 0) {
    url += "&ids=" + encodeURIComponent(selectedIds.join(','));
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Export failed');

    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "transactions." + (type==='csv' ? 'csv' : 'pdf');
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error(err);
    showToast('Export failed');
  }
}

document.getElementById('exportCsv')?.addEventListener('click', () => downloadFile('csv'));
document.getElementById('exportPdf')?.addEventListener('click', () => downloadFile('pdf'));


/* ---------------- instant filter triggers ---------------- */
document.getElementById('fromDate')?.addEventListener('change', resetAndLoad);
document.getElementById('toDate')?.addEventListener('change', resetAndLoad);

let searchTimer;
document.getElementById('searchBox')?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(resetAndLoad, 350);
});


document.getElementById('clearFilters')?.addEventListener('click', ()=>{ document.getElementById('fromDate').value='';
 document.getElementById('toDate').value=''; document.getElementById('searchBox').value='';
 resetAndLoad();
 });
 
/* ===== Preview toggle buttons ===== */
document.getElementById('btnReceipt')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!currentTransactionId) return;

  currentPreviewType = 'receipt';
  setActivePreviewButtons();
  updatePreview();
});

document.getElementById('btnInvoice')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!currentTransactionId) return;

  currentPreviewType = 'invoice';
  setActivePreviewButtons();
  updatePreview();
});
function resetAndLoad() {
  currentPage = 1;
  updatePageLabel();
  loadTransactions();
}

function init() {
  window.transactionsPageActive = true;

  updateTrashUI();
  updatePageLabel();
  resetAndLoad();
}

function destroy() {
  window.transactionsPageActive = false;
}
  return {
    init,
    destroy
  };

})();





