 window.PosPage = (function () {

    let initialized = false;

    function init() {

        if (initialized) return;
        initialized = true;
      if (window.OfflineDB) OfflineDB.init();

let audioCtx;
try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
} catch(e) {}
    const saveBtn = document.getElementById('saveTransactionBtn');
    if (!saveBtn) return; // ← SPA safety (not on POS page)

    console.log("POS INITIALIZED");
    let muted = false;
    

    // ================= SYSTEM BEEP =================
    function systemBeep(type = 'success') {
        if (muted) return;

        try {
            
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNode.gain.value = 0.2;
            oscillator.type = 'sine';

            if (type === 'cart') {                 // 🛒 add to cart
                oscillator.frequency.value = 900;
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.12);

            } else if (type === 'save') {          // 💾 save success (double beep)
                oscillator.frequency.value = 700;
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.12);

                const osc2 = audioCtx.createOscillator();
                osc2.connect(gainNode);
                osc2.frequency.value = 1000;
                osc2.start(audioCtx.currentTime + 0.18);
                osc2.stop(audioCtx.currentTime + 0.3);

            } else if (type === 'danger') {        // ❌ error
                oscillator.frequency.value = 220;
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2);

            } else {                             // default success
                oscillator.frequency.value = 880;
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.15);
            }

        } catch (e) { }
   
 }
    // ✅ THIS MUST BE HERE (NO OTHER PLACE)
    function playSound(type) {
        if (type === 'cart') systemBeep('cart');
        else if (type === 'save') systemBeep('save');
        else if (type === 'danger') systemBeep('danger');
        else systemBeep('success');
    }
    // Mute button logic
    const muteBtn = document.getElementById('muteBtn');

if (muteBtn) {
    muteBtn.innerText = muted ? '🔇 Muted' : '🔊 Unmute';

    muteBtn.addEventListener('click', () => {
        muted = !muted;
        muteBtn.innerText = muted ? '🔇 Muted' : '🔊 Unmute';
    });
}

    // ---------------- UTILITY ----------------
    function showToast(message, type = 'cart') {
        const container = document.getElementById('toastContainer');
         if (!container) return; 
          while (container.firstChild) container.firstChild.remove();

        const toastEl = document.createElement('div');

        // Determine background color
        let bgClass = 'bg-dark text-white'; // add to cart = black
        if (type === 'save') bgClass = 'bg-success text-white'; // save success = green
        else if (type === 'danger') bgClass = 'bg-danger text-white'; // errors

        toastEl.className = `toast align-items-center ${bgClass} border-0 mb-2`;
        toastEl.role = "alert";
        toastEl.ariaLive = "assertive";
        toastEl.ariaAtomic = "true";
        toastEl.innerHTML = `
    <div class="d-flex">
        <div class="toast-body">${message}</div>
    </div>
`;

        container.appendChild(toastEl);
        // Set delay based on type: cart = super fast (<1s), save = normal 3s
        const toastDelay = (type === 'cart') ? 800 : 3000;

        const toast = new bootstrap.Toast(toastEl, {
            delay: toastDelay,
            animation: true
        });

        toast.show();

        // Remove DOM after hidden
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });

        // Play sound
        playSound(type);
    }
    function sanitizeNumber(value) {
        let num = parseFloat(String(value).replace(/,/g, '')) || 0;
        if (num < 0) num = 0;
        return num.toFixed(2);
    }

    // ---------------- CART LOGIC ----------------
    let cart = [];
let cartVersion = 0;

    function focusCartQty() {
        const qtyInput = document.querySelector('#cartTable tbody input[type="number"]');
        if (qtyInput) qtyInput.focus();
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    function renderCart() {
    const tbody = document.querySelector("#cartTable tbody");
    const paidEl = document.getElementById('paid');

    if (!tbody || !paidEl) return;
        if (!cart.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Cart empty</td></tr>';
            paidEl.value = '0.00';
            updateSummary();
            attachAutoSelect(); // ensure Paid field remains auto-selectable even when cart is empty
            return;
        }

        tbody.innerHTML = cart.map((it, i) => `
        <tr>
            <td class="fw-bold">${escapeHtml(it.product_name)}</td>
            <td class="text-start">
                <div class="mb-1">
                    <label class="small fw-semibold">Unit Price</label>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">MWK</span>
                        <input type="number" min="0" step="0.01"
   value="${parseFloat(it.unit_price).toFixed(2)}"
   class="form-control text-center money-field unit-price-input"
   data-index="${i}">
                    </div>
                </div>
                <div class="mb-1">
                    <label class="small fw-semibold">Quantity</label>
                    <input type="number" min="1" step="1"
   value="${parseInt(it.quantity)}"
   class="form-control form-control-sm text-center money-field qty-input"
   data-index="${i}">
                </div>
                <div class="mb-1">
                    <label class="small fw-semibold">Discount</label>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">MWK</span>
                       <input type="number" min="0" step="0.01"
   value="${parseFloat(it.discount).toFixed(2)}"
   class="form-control text-center money-field discount-input"
   data-index="${i}">
                    </div>
                </div>
                <div class="fw-bold text-end">Total: MWK ${(it.unit_price * it.quantity - it.discount).toFixed(2)}</div>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-danger remove-item-btn" data-index="${i}">Remove</button>
            </td>
        </tr>
    `).join('');

        attachAutoSelect(); // make cart inputs AND Paid field selectable
        updateSummary();
    }
    function updateUnitPrice(i, v) { cart[i].unit_price = parseFloat(sanitizeNumber(v)); renderCart(); }
    function updateQty(i, v) { let q = parseInt(v) || 1; if (q < 1) q = 1; cart[i].quantity = q; renderCart(); }
    function updateDiscount(i, v) { cart[i].discount = parseFloat(sanitizeNumber(v)); renderCart(); }
    function removeItem(i) { cart.splice(i, 1); renderCart(); }
    // ---------------- AUTO-SELECT INPUTS ----------------
    function autoSelectHandler(e) {
        e.target.select();
    }

    function attachAutoSelect() {
        const inputs = document.querySelectorAll('.money-field, #paid, #cartTable input[type="number"]');

        inputs.forEach(input => {
            input.removeEventListener('focus', autoSelectHandler);
            input.addEventListener('focus', autoSelectHandler);
        });
    }


    function updateSummary() {
        let subtotal = 0;
        let discount = 0;

        cart.forEach(it => {
            subtotal += it.unit_price * it.quantity;
            discount += it.discount || 0;
        });

        const total = subtotal - discount;

        document.getElementById('subtotal').innerText = `MWK ${subtotal.toFixed(2)}`;
        document.getElementById('total').innerText = `MWK ${total.toFixed(2)}`;

        let paidEl = document.getElementById('paid');
        let paid = parseFloat(paidEl.value) || 0;
        if (cart.length && paid === 0) { paid = total; paidEl.value = paid.toFixed(2); }

        let change = paid - total; if (change < 0) change = 0;
        document.getElementById('change_due').innerText = `MWK ${change.toFixed(2)}`;
    }

    const paidInput = document.getElementById('paid');
if (paidInput) {
    paidInput.addEventListener('input', updateSummary);
}
// ---------------- PRODUCT SEARCH ----------------
const searchBox = document.getElementById("searchBox");
const searchResultsEl = document.getElementById("searchResults");
const clearSearchBtn = document.getElementById("clearSearchBtn");

let searchTimeout = null;
let allowSearchAutoFocus = true;

// Prevent crash if not on POS page
if (searchBox && searchResultsEl) {

    function triggerSearch(term) {

        if (!term) {
            searchResultsEl.innerHTML = '';
            return;
        }

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(async () => {
            try {
                const resp = await fetch(
                    `/backend/pos_crud.php?action=search_product&term=${encodeURIComponent(term)}`,
                    { credentials: "same-origin" }
                );

                const data = await resp.json();

                if (data.success && data.data.length > 0) {

                    searchResultsEl.innerHTML = data.data.map(p => {

                        let badge = '';

                        if (p.is_service == 1) {
                            badge = `<span class="badge bg-secondary rounded-pill">OK</span>`;
                        } else {
                            let qty = parseInt(p.quantity || 0);
                            if (qty === 0) badge = `<span class="badge bg-danger rounded-pill">Out of stock</span>`;
                            else if (qty <= 2) badge = `<span class="badge bg-warning text-dark rounded-pill">${qty} low stock</span>`;
                            else badge = `<span class="badge bg-success rounded-pill">${qty} in stock</span>`;
                        }

                        return `
                            <button type="button"
                              class="list-group-item list-group-item-action search-item-btn"
                              data-id="${p.id}"
                              data-name="${escapeHtml(p.name)}"
                              data-price="${p.unit_price}"
                              data-stock="${p.quantity}"
                              data-is-service="${p.is_service}">
                              <strong>${escapeHtml(p.name)}</strong>
                              - MWK ${parseFloat(p.unit_price).toFixed(2)} ${badge}
                            </button>
                        `;
                    }).join('');

                } else {
                    searchResultsEl.innerHTML =
                        '<div class="text-muted text-center p-2">No matching products</div>';
                }

            } catch (e) {
                console.error("SEARCH ERROR:", e);
                searchResultsEl.innerHTML =
                    '<div class="text-danger text-center p-2">Error loading products</div>';
                showToast('Error loading products', 'danger');
            }
        }, 200);
    }

    function attachSearchListeners() {

        const handler = () => {
            const term = searchBox.value.trim();
            if (clearSearchBtn) {
                clearSearchBtn.style.display = term.length ? 'block' : 'none';
            }
            triggerSearch(term);
        };

        // Desktop
        searchBox.addEventListener("input", handler);

        // Mobile fallback
        searchBox.addEventListener("change", handler);
        searchBox.addEventListener("keyup", handler);

        // Android IME fix
        searchBox.addEventListener("compositionend", handler);
    }

    attachSearchListeners();

    // Delegated click (important!)
    searchResultsEl.addEventListener('click', function (e) {
        const btn = e.target.closest('.search-item-btn');
        if (!btn) return;

        addToCart({
    id: parseInt(btn.dataset.id),
    product_name: btn.dataset.name,
    unit_price: parseFloat(btn.dataset.price),
    stock: parseInt(btn.dataset.stock),
    is_service: parseInt(btn.dataset.isService)
});
    });

    searchBox.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            const firstBtn = searchResultsEl.querySelector("button");
            if (firstBtn) firstBtn.click();
        }
    });

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            searchBox.value = '';
            searchResultsEl.innerHTML = '';
            clearSearchBtn.style.display = 'none';
            searchBox.focus();
        });
    }

    // Auto-focus logic
    document.addEventListener('focusin', (e) => {
        if (e.target !== searchBox) {
            allowSearchAutoFocus = false;
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('input, textarea, select, button, .modal')) {
            allowSearchAutoFocus = true;
            searchBox.focus();
        }
    });

    function clearProductSearch() {
        searchBox.value = '';
        searchResultsEl.innerHTML = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    }
}

    let qrScanner;
    const scanQrBtn = document.getElementById('scanQrBtn');
if (scanQrBtn) {
    scanQrBtn.addEventListener('click', () => {
        const scannerEl = document.getElementById('qrScanner');
        if (scannerEl.style.display === 'none') {
            scannerEl.style.display = 'block';
            if (!qrScanner) {
                qrScanner = new Html5Qrcode("qrScanner");
                qrScanner.start({ facingMode: "environment" },
                    { fps: 10, qrbox: 250 },
                    (decodedText, decodedResult) => {
                        console.log("QR Code scanned:", decodedText);
                        // Auto-search and add product
                       if (searchBox) {
    searchBox.value = decodedText;
    searchBox.dispatchEvent(new Event('input'));
}

qrScanner.stop().then(() => scannerEl.style.display = 'none');
                    },
                    (errorMessage) => {
                        console.warn("QR scan error:", errorMessage);
                    }
                ).catch(err => console.error("QR scanner failed to start", err));
            }
        } else {
            qrScanner.stop().then(() => scannerEl.style.display = 'none');
        }
    });
}
    // ---------------- SAVE TRANSACTION ----------------
    let isSavingTransaction = false;
    async function submitTransaction(payload) {

    // ✅ OFFLINE MODE
    if (!navigator.onLine) {

        await OfflineDB.saveSale(payload);

        showToast('Saved offline. Will sync automatically.', 'save');

        cart = [];
        renderCart();
        document.getElementById('paid').value = '0.00';
        updateSummary();

        disableSaveButton(false);
        isSavingTransaction = false;

        return;
    }

    try {
             const res = await fetch('/backend/pos_crud.php?action=save_transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
});
            const data = await res.json();
            if (data.success) {
                showToast('Transaction saved successfully', 'save');

                const tid = data.transaction_id;
                document.getElementById('receiptFrame').src = `/print_receipt.php?id=${tid}`;
                document.getElementById('invoiceFrame').src = `/print_invoice.php?id=${tid}`;
                document.getElementById('previewModal')?.style.setProperty('display', 'block');

                cart = []; renderCart();
             if (typeof clearProductSearch === "function") {
             clearProductSearch();}
                document.getElementById('paid').value = '0.00';
                document.getElementById('payment_mode').value = 'Cash';
                document.getElementById('cashPaidBox')?.style.setProperty('display', 'block');
                document.getElementById('changeRow')?.style.setProperty('display', 'block');
                updateSummary();
            } else {
                showToast('Save failed: ' + data.message, 'danger');
            }
        } catch (e) {
            console.error(e);
            showToast('Error saving transaction', 'danger');
        } finally {
            disableSaveButton(false);
            isSavingTransaction = false;
        }
    }
    function disableSaveButton(disable = true) {
        saveBtn.disabled = disable;
        saveBtn.innerText = disable ? 'Saving...' : '💾 Save Transaction';
    }

    let pendingTransactionPayload = null; // store transaction temporarily
    let countdownTimer = null;

    const confirmModalEl = document.getElementById('confirmSaveModal');
    const modalCountdownEl = document.getElementById('modalCountdown');
    const confirmSaveBtn = document.getElementById('confirmSaveTransactionBtn');
    let confirmModal = null;
if (confirmModalEl) {
    confirmModal = new bootstrap.Modal(confirmModalEl);
}
    saveBtn.addEventListener('click', () => {
        if (!cart.length) {
            showToast('Cart is empty', 'danger');
            return;
        }

        if (isSavingTransaction) return;

        // Prepare payload and store in pendingTransactionPayload
        const subtotal = cart.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
        const discount = cart.reduce((sum, it) => sum + (it.discount || 0), 0);
        const total = subtotal - discount;

        pendingTransactionPayload = {
            items: cart.map(i => ({
                id: i.id,
                quantity: i.quantity,
                unit_price: i.unit_price,
                discount: i.discount
            })),
            subtotal: subtotal.toFixed(2),
            discount: discount.toFixed(2),
            total: total.toFixed(2),
            paid: parseFloat(document.getElementById('paid').value) || 0,
            payment_mode: document.getElementById('payment_mode').value
        };

        // Show modal
        confirmModal.show();

        // Start countdown (3 seconds)
        let countdown = 3;
        modalCountdownEl.innerText = `Saving in ${countdown}...`;

        countdownTimer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                modalCountdownEl.innerText = '';
                confirmModal.hide();
                executeSaveTransaction(); // actually save
            } else {
                modalCountdownEl.innerText = `Saving in ${countdown}...`;
            }
        }, 1000);
    });

    // Cancel button automatically clears countdown
    if (confirmModalEl) {
    const cancelBtn = confirmModalEl.querySelector('[data-bs-dismiss="modal"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (countdownTimer) clearInterval(countdownTimer);
            countdownTimer = null;
            pendingTransactionPayload = null;
            modalCountdownEl.innerText = '';
        });
    }
}

    // Manual confirm button
    if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener('click', () => {
        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = null;
        modalCountdownEl.innerText = '';
        confirmModal.hide();
        executeSaveTransaction();
    });
}
    // Function to actually save transaction
    async function executeSaveTransaction() {
        if (!pendingTransactionPayload) return;

        isSavingTransaction = true;
        disableSaveButton(true); // lock immediately

        try {
            await submitTransaction(pendingTransactionPayload);
        } finally {
            isSavingTransaction = false;
            disableSaveButton(false); // unlock after done
            pendingTransactionPayload = null;
        }
    }
    // ---------------- KEYBOARD SHORTCUTS ----------------
   const cartBody = document.querySelector('#cartTable tbody');

if (cartBody) {

    // REMOVE BUTTON
    cartBody.addEventListener('click', function (e) {
        const removeBtn = e.target.closest('.remove-item-btn');
        if (!removeBtn) return;

        const index = parseInt(removeBtn.dataset.index);
        if (!isNaN(index)) {
            removeItem(index);
        }
    });

    // INPUT CHANGES
    cartBody.addEventListener('change', function (e) {

        const index = parseInt(e.target.dataset.index);
        if (isNaN(index)) return;

        if (e.target.classList.contains('unit-price-input')) {
            updateUnitPrice(index, e.target.value);
        }

        if (e.target.classList.contains('qty-input')) {
            updateQty(index, e.target.value);
        }

        if (e.target.classList.contains('discount-input')) {
            updateDiscount(index, e.target.value);
        }

    });
}
    document.addEventListener('keydown', (e) => {

        // Prevent shortcuts if any Bootstrap modal is open
        const openModal = document.querySelector('.modal.show');
        if (openModal) return;

        // Ctrl+S or F2 = Save
        if ((e.ctrlKey && e.key.toLowerCase() === 's') || e.key === 'F2') {
            e.preventDefault();
            saveBtn.click();
            return;
        }

        // Enter key handling
        if (e.key === 'Enter') {

            const activeElement = document.activeElement;

            if (
                activeElement?.id === 'paid' ||
                cartBody?.contains(activeElement)
            ) {
                e.preventDefault();
                saveBtn.click();
            }
        }
    });


    // Play sound utility

    // ---------------- CART ADDITION IMPROVED ----------------
    function addToCart(p) {
    const isService = String(p.is_service) === "1";
const stock = parseInt(p.stock ?? 0);

    if (!isService) {
    if (stock <= 0) {
        showToast('Out of stock', 'danger');
        return;
    }
}

    const existing = cart.find(i => i.id === p.id);

    if (existing) {
        if (!isService && existing.quantity + 1 > stock) {
            showToast('Insufficient stock', 'danger');
            return;
        }
        existing.quantity++;
    } else {
        cart.push({
            id: p.id,
            product_name: p.product_name,
            unit_price: parseFloat(p.unit_price),
            quantity: 1,
            discount: 0,
            stock: stock,
            is_service: p.is_service
        });
    }

    showToast('Product added to cart', 'cart');
    renderCart();
    focusCartQty();
    clearProductSearch();

    if (cart.length) {
        saveBtn.focus();
    }
}

   // AUTO-CLOSE PREVIEW MODAL WHEN CLICKING OUTSIDE
document.addEventListener('click', function (e) {
    const previewModal = document.getElementById('previewModal');

    if (!previewModal) return; // ← prevents crash

    if (previewModal.style.display === 'block' && !previewModal.contains(e.target)) {
        previewModal.style.display = 'none';
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const previewModal = document.getElementById('previewModal');
        if (previewModal) {
            previewModal.style.display = 'none';
        }
    }
});

// ---------------- OFFLINE SYNC ----------------
async function syncOfflineSales() {

    if (!navigator.onLine) return;

    try {

        const pending = await OfflineDB.getPendingSales();

        if (!pending.length) return;

        console.log("Syncing offline sales:", pending.length);

        for (const sale of pending) {

            try {
                await submitTransaction(sale.data);
                await OfflineDB.markSynced(sale.id);
            } catch (e) {
                console.error("Sync failed for sale:", sale.id, e);
            }

        }

    } catch (err) {
        console.error("Offline sync error:", err);
    }
}

// Sync immediately when internet returns
window.addEventListener('online', syncOfflineSales);

// Retry sync every 30 seconds
setInterval(syncOfflineSales, 30000);

// Run once on page load
syncOfflineSales();

} // end init()
    

    function destroy() {
        initialized = false;
        console.log("POS DESTROYED");
    }

    return {
        init,
        destroy
    };

})();