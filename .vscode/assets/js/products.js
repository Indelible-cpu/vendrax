(function () {

  if (window.productsScriptLoaded) {
    console.warn("products.js already loaded");
    return;
  }

  window.productsScriptLoaded = true;
const PRODUCT_API = "/backend/products_crud.php";

let products = [];
let categories = [];
let currentPage = 1;
let pageSize = 10;

function formatMWK(v){
  if (v === null || v === undefined) return "—";
  return "MWK " + Number(v).toLocaleString("en-MW");
}


function showToast(type, message){
  const toastEl = document.getElementById("globalToast");
  const body = document.getElementById("globalToastBody");
  body.textContent = message;
  toastEl.className = "toast align-items-center border-0";
  toastEl.classList.add("text-bg-" + (type === "error" ? "danger" : (type || "success")));
  toastEl.style.display = "";
  const bs = new bootstrap.Toast(toastEl, { delay: 3000 });
  bs.show();
  toastEl.addEventListener("hidden.bs.toast", () => { toastEl.style.display = "none"; }, { once: true });
}

function showConfirm(message, onConfirm, type = "warning") {
  const header = document.getElementById("confirmHeader");
  const title = document.getElementById("confirmTitle");
  const okBtn = document.getElementById("confirmOk");

  header.className = "modal-header text-white";
  okBtn.className = "btn";

  if(type === "delete"){
    header.classList.add("bg-danger");
    okBtn.classList.add("btn-danger");
    title.textContent = "🗑 Confirm Delete";
  }
  else if(type === "save"){
    header.classList.add("bg-success");
    okBtn.classList.add("btn-success");
    title.textContent = "💾 Confirm Save";
  }
  else{
    header.classList.add("bg-warning");
    okBtn.classList.add("btn-warning");
    title.textContent = "⚠️ Please Confirm";
  }

  document.getElementById("confirmMessage").textContent = message;

  const modalEl = document.getElementById("confirmModal");
  const bsModal = new bootstrap.Modal(modalEl);

  const handler = async () => {
    okBtn.disabled = true;   // prevent double click

    try {
      await onConfirm();     // ✅ await the async callback
    } finally {
      okBtn.disabled = false;
      okBtn.removeEventListener("click", handler);
      bsModal.hide();
    }
  };

  okBtn.addEventListener("click", handler);
  bsModal.show();
}








function stockStatus(p){
  const slug = (p.category_slug || "").toString().toLowerCase();
  const catName = (p.category || "").toString().toLowerCase();
  if(slug === "service" || catName === "services" || catName === "service") {
    return `<span class="badge bg-secondary">OK</span>`;
  }
  const qty = parseInt(p.quantity) || 0;
  return qty <= 2 ? `<span class="badge bg-danger">Low Stock</span>` : `<span class="badge bg-success">In Stock</span>`;
}

function filteredProducts(){
  const cat = document.getElementById("filterCategory").value;
  const search = document.getElementById("searchName").value.toLowerCase();
  return products.filter(p => {
    const matchCat = !cat || String(p.category_id) === String(cat);
    const matchSearch = !search || (p.name || "").toLowerCase().includes(search);
    return matchCat && matchSearch;
  });
}
 
async function loadBackendTotals() {
  try {
    const r = await fetch(PRODUCT_API + "?action=totals");
    const res = await r.json();

    if (!res.success) {
      throw new Error("Totals API failed");
    }

    const t = res.data;

    document.getElementById("totalCost").textContent   = formatMWK(t.total_cost);
    document.getElementById("totalSell").textContent   = formatMWK(t.total_sell);
    document.getElementById("totalProfit").textContent = formatMWK(t.total_profit);
    document.getElementById("totalQty").textContent    = t.total_qty;

  } catch (err) {
    console.error("loadBackendTotals error", err);
    showToast("error", "Failed loading totals");
  }
}



function renderProducts(){
  const out = document.querySelector("#productsTable tbody");
  const rows = filteredProducts();
  const start = (currentPage - 1) * pageSize;
  const paginated = rows.slice(start, start + pageSize);

  out.innerHTML = "";

  if (!rows.length) {
    out.innerHTML = `<tr>
      <td colspan="11" class="text-center text-muted">No products</td>
    </tr>`;
    document.getElementById("paginationInfo").textContent =
      `Page 1 of 1`;
    focusedRowIndex = -1;
    updateTableRows();
    return;
  }

  paginated.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.sku || "—"}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${formatMWK(p.cost_price)}</td>
      <td>${formatMWK(p.sell_price)}</td>
      <td class="${((p.sell_price - p.cost_price) * p.quantity) < 0 ? 'text-danger' : 'text-success'}">
        ${formatMWK((Number(p.sell_price || 0) - Number(p.cost_price || 0)) * Number(p.quantity || 0))}
      </td>
      <td class="text-center fw-bold">${p.quantity}</td>
      <td>${stockStatus(p)}</td>
      <td>${p.created_at}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" data-action="edit" data-id="${p.id}">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;
    out.appendChild(tr);
  });

  document.getElementById("paginationInfo").textContent =
    `Page ${currentPage} of ${Math.max(1, Math.ceil(rows.length / pageSize))}`;

  // ✅ keyboard refresh
  focusedRowIndex = -1;
  updateTableRows();
}


function escapeHtml(str){
  if(str === null || str === undefined) return '';
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#039;");
}

async function loadCategories(){
  try{
    const r = await fetch(PRODUCT_API+"?action=categories");
    const data = await r.json();
    categories = data || [];
    const select = document.getElementById("category_id");
    const filter = document.getElementById("filterCategory");
    select.innerHTML = `<option value="">-- Select --</option>`;
    filter.innerHTML = `<option value="">-- All Categories --</option>`;
    categories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.title;
      select.appendChild(opt);
      filter.appendChild(opt.cloneNode(true));
    });
  }catch(err){
    console.error("loadCategories error", err);
    showToast("error", "Failed loading categories");
  }
}

async function loadProducts(){
  try{
    const r = await fetch(PRODUCT_API+"?action=fetch");
    const data = await r.json();

    if (data.success) {
      products = data.data || [];
    } else if (Array.isArray(data)) {
      products = data;
    } else {
      console.error("Fetch error:", data.error || data);
      products = [];
    }

    currentPage = 1;
    renderProducts();
 // ✅ BACKEND TOTALS (AUTHORITATIVE)
   loadBackendTotals();
  }catch(err){
    console.error("loadProducts error", err);
    showToast("error", "Failed loading products");
  }
}
/* ================== BIND EVENTS (ONCE) ================== */

function bindEventsOnce() {
  const root = document.getElementById("productsPage");
  if (!root || root.dataset.eventsBound === "1") return;
  root.dataset.eventsBound = "1";

  document.getElementById("productsTable")?.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "edit") editProduct(id);
    if (btn.dataset.action === "delete")
      showConfirm("Delete this product?", () => deleteProduct(id), "delete");
  });

  document.getElementById("productForm")?.addEventListener("submit", productFormHandler);

  document.getElementById("btnAddProduct")?.addEventListener("click", addProductHandler);

  document.getElementById("prevPage")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderProducts();
    }
  });

  document.getElementById("nextPage")?.addEventListener("click", () => {
    const rows = filteredProducts();
    if (currentPage * pageSize < rows.length) {
      currentPage++;
      renderProducts();
    }
  });

  document.getElementById("filterCategory")?.addEventListener("change", () => {
    currentPage = 1;
    renderProducts();
  });

  document.getElementById("searchName")?.addEventListener("input", () => {
    currentPage = 1;
    renderProducts();
  });

  document.getElementById("btnClearFilters")?.addEventListener("click", () => {
    document.getElementById("filterCategory").value = "";
    document.getElementById("searchName").value = "";
    currentPage = 1;
    renderProducts();
  });

  const scrollArea = document.getElementById("tableScrollArea");
  if (scrollArea && !scrollArea.dataset.swipeBound) {
    scrollArea.dataset.swipeBound = "1";
    let startX = 0;
    scrollArea.addEventListener("touchstart", e => {
      startX = e.changedTouches[0].screenX;
    });
    scrollArea.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].screenX - startX;
      if (Math.abs(dx) > 50) {
        dx < 0 ? nextPage.click() : prevPage.click();
      }
    });
  }
}
async function productFormHandler(e) {
  e.preventDefault();
  showConfirm("Save this product?", async () => {
    const formData = new FormData(e.target);
    try {
      const r = await fetch(PRODUCT_API + "?action=save", {
        method: "POST",
        body: formData
      });
      const res = await r.json();
      if (res.success) {
        showToast("success", "Product saved");
        bootstrap.Modal.getInstance(
          document.getElementById("productModal")
        ).hide();
        loadProducts();
      } else {
        showToast("error", res.message || "Save failed");
      }
    } catch {
      showToast("error", "Save error");
    }
  }, "save");
}

async function addProductHandler() {
  await loadCategories();
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("sku").value = "";
  new bootstrap.Modal(document.getElementById("productModal")).show();
}



async function editProduct(id){
  const prod = products.find(p => String(p.id) === String(id));
  if(!prod) return showToast("error", "Product not found");
  await loadCategories();

  document.getElementById("productId").value = prod.id;
  document.getElementById("sku").value = prod.sku || "";
  document.getElementById("name").value = prod.name;
  document.getElementById("description").value = prod.description || "";
  document.getElementById("cost_price").value = Math.round(prod.cost_price || 0);
  document.getElementById("sell_price").value = Math.round(prod.sell_price || 0);
  document.getElementById("quantity").value = prod.quantity;
  document.getElementById("category_id").value = prod.category_id;

  new bootstrap.Modal(document.getElementById("productModal")).show();
}

async function deleteProduct(id){
  try{
    const r = await fetch(PRODUCT_API+"?action=delete&id="+id);
    const res = await r.json();
    if(res.success){ showToast("success", "Product deleted"); loadProducts(); }
    else showToast("error", res.message || "Delete failed");
  }catch(err){ console.error("deleteProduct", err); showToast("error", "Delete error"); }
}

window.initProductsPage = async function () {

  console.log("initProductsPage running");

  const root = document.getElementById("productsPage");
  if (!root) return;

  bindEventsOnce();

  await loadCategories();
  await loadProducts();

  focusedRowIndex = -1;
  updateTableRows();

  document.getElementById("btnAddProduct")?.focus();
};
  // ✅ SAFE MODAL ACCESS
  const modal = document.getElementById("productModal");

  if(modal){

    const modalInputs = Array.from(
      modal.querySelectorAll("input, select, textarea")
    ).filter(i => i.id !== "sku");

    modalInputs.forEach((input, idx) => {
      input.addEventListener("keydown", e => {

        if (e.key === "Enter") {
          e.preventDefault();

          if (idx < modalInputs.length - 1) {
            modalInputs[idx + 1].focus();
          } else {
            document.getElementById("productForm")
              ?.dispatchEvent(new Event("submit", { cancelable: true }));
          }
        }

        else if (e.key === "Escape") {
          bootstrap.Modal.getInstance(modal)?.hide();
        }

      });
    });

  }



/* ---------- FULL KEYBOARD SUPPORT ---------- */

let tableRows = [];
let focusedRowIndex = -1;

function updateTableRows() {
  tableRows = Array.from(document.querySelectorAll("#productsTable tbody tr"));
  tableRows.forEach((tr, idx) => tr.classList.remove("table-active"));
  if (focusedRowIndex >= 0 && tableRows[focusedRowIndex]) {
    tableRows[focusedRowIndex].classList.add("table-active");
    tableRows[focusedRowIndex].scrollIntoView({ block: "center", behavior: "smooth" });
  }
}


// Table row navigation
document.addEventListener("keydown", e => {
  const activeElement = document.activeElement;
const modalEl = document.getElementById("productModal");
const isModalOpen = modalEl ? modalEl.classList.contains("show") : false;


  // Ignore if typing in modal input/textarea (we handle modal separately)
  if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable) return;

  // --- Table Navigation ---
  if (!isModalOpen) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (focusedRowIndex < tableRows.length - 1) focusedRowIndex++;
      updateTableRows();
    }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (focusedRowIndex > 0) focusedRowIndex--;
      updateTableRows();
    }
    else if (e.key === "Enter" && focusedRowIndex >= 0) {
      e.preventDefault();
      const editBtn = tableRows[focusedRowIndex].querySelector("button[data-action='edit']");
      if (editBtn) editBtn.click();
    }
    else if (e.key === "Delete" && focusedRowIndex >= 0) {
      e.preventDefault();
      const deleteBtn = tableRows[focusedRowIndex].querySelector("button[data-action='delete']");
      if (deleteBtn) showConfirm("Delete this product?", () => deleteBtn.click(), "delete");
    }
  }

  // --- Global Add Product Shortcut ---
  if (!isModalOpen && document.getElementById("btnAddProduct") && e.key === "Enter") {
    const btn = document.getElementById("btnAddProduct");
    if (document.activeElement === btn) {
      e.preventDefault();
      btn.click();
    }
  }
});

// --- Modal Keyboard Navigation ---



// --- Confirm modal: Enter triggers Yes ---
document.addEventListener("keydown", e => {
  const confirmModal = document.getElementById("confirmModal");
  const okBtn = document.getElementById("confirmOk");

  if (!confirmModal) return;

  if (confirmModal.classList.contains("show") && e.key === "Enter") {
    e.preventDefault();
    okBtn?.click();
  }
  else if (confirmModal.classList.contains("show") && e.key === "Escape") {
    bootstrap.Modal.getInstance(confirmModal)?.hide();
  }
});


// --- Focus Add Product Button on Tab navigation if nothing selected ---
document.addEventListener("keydown", e => {
const modalEl = document.getElementById("productModal");

if (e.key === "Tab" && focusedRowIndex === -1 && !(modalEl && modalEl.classList.contains("show")))

 {
    document.getElementById("btnAddProduct")?.focus();
  }
});
  if (location.hash === "#products") {
    window.initProductsPage?.();
  }

})();
