

/* ===============================
   Toast helper
=============================== */
function showToast(type, message) {
  const id = "toast-" + Date.now();
  const html = `<div id="${id}" class="toast align-items-center text-bg-${type} border-0 fade" role="alert">
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  </div>`;
  document.querySelector(".toast-container").insertAdjacentHTML("beforeend", html);
  const el = document.getElementById(id);
  new bootstrap.Toast(el, { delay: 3000 }).show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

/* ===============================
   Confirm helper
=============================== */
function showConfirm(message, onConfirm, type="warning") {
  const header = document.getElementById("confirmHeader");
  const title = document.getElementById("confirmTitle");
  const okBtn = document.getElementById("confirmOk");
  header.className = "modal-header text-white";
  okBtn.className = "btn";

  switch(type) {
    case "delete": header.classList.add("bg-danger"); okBtn.classList.add("btn-danger"); title.textContent="🗑 Confirm Delete"; break;
    case "save": header.classList.add("bg-success"); okBtn.classList.add("btn-success"); title.textContent="💾 Confirm Save"; break;
    default: header.classList.add("bg-warning"); okBtn.classList.add("btn-warning"); title.textContent="⚠️ Please Confirm";
  }

  document.getElementById("confirmMessage").textContent = message;

  const modalEl = document.getElementById("confirmModal");
  const bsModal = new bootstrap.Modal(modalEl);

  const newBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newBtn, okBtn);

  newBtn.addEventListener("click", () => { onConfirm(); bsModal.hide(); });
  bsModal.show();
}

/* ===============================
   Fetch helper
=============================== */
async function fetchJsonOrText(url, opts) {
  try {
   const res = await fetch(url, {
  credentials: "same-origin",
  ...opts
});

    const text = await res.text();
    try { return { ok: res.ok, json: JSON.parse(text), text }; }
    catch { return { ok: res.ok, json:null, text }; }
  } catch(err) { return { ok:false, error: err.message ?? err.toString() }; }
}

/* ===============================
   Escape HTML
=============================== */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

/* ===============================
   Load users
=============================== */
async function loadUsers() {
  const tbody = document.querySelector("#usersTable tbody");

  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="text-center text-muted">Loading...</td>
    </tr>
  `;

  const r = await fetchJsonOrText(API_URL + "?action=fetch");

  if (!r.ok) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-danger text-center">
          Failed to load users
        </td>
      </tr>
    `;
    return;
  }

  let users = [];

if (Array.isArray(r.json)) {
  users = r.json;
} else if (Array.isArray(r.json?.data)) {
  users = r.json.data;
}
  if (!users.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted">
          No users found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  users.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.id}</td>

      <td>
        ${
          u.profile_pic
            ? `<img src="/backend/uploads/profiles/${u.profile_pic}" class="rounded-circle" width="40" height="40">`
            : '—'
        }
      </td>

      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.fullname)}</td>
      <td>${u.email ?? '—'}</td>
      <td>${u.phone ?? '—'}</td>

      <td>
        ${
          u.role
            ? `<span class="badge badge-role-${u.role.toLowerCase().replace(/\s+/g,'-')}">${u.role}</span>`
            : '—'
        }
      </td>

      <td>${u.created_at}</td>

      <td>
        <button class="btn btn-sm btn-warning me-1" data-action="edit" data-id="${u.id}">
          <i class="bi bi-pencil-square"></i>
        </button>

        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${u.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ===============================
   Load roles
=============================== */
async function loadRoles() {
  const r = await fetchJsonOrText(API_URL + "?action=roles");
  const select = document.getElementById("role_id");
  select.innerHTML = `<option value="">-- Select role --</option>`;
  if (r.ok && r.json) r.json.forEach(role => {
    const opt = document.createElement("option");
    opt.value = role.id; opt.textContent = role.name;
    select.appendChild(opt);
  });
}

/* ===============================
   Phone inline +265 normalization
=============================== */
/* ===============================
   Save user
=============================== */
async function saveUser(ev) {
  const fd = new FormData(ev.target);
  fd.set("csrf_token", CSRF_TOKEN);
  const r = await fetchJsonOrText(API_URL + "?action=save", { method:"POST", body:fd });
  if (!r.ok || !(r.json?.success)) return showToast("danger", "❌ Save failed: " + (r.json?.error ?? r.text));
  showToast("success", "✅ User saved");
  bootstrap.Modal.getInstance(document.getElementById("userModal"))?.hide();
  loadUsers();
}

/* ===============================
   Delete user
=============================== */
async function deleteUser(id) {
  const fd = new FormData();
  fd.set("csrf_token", CSRF_TOKEN);
  fd.set("id", id);
  const r = await fetchJsonOrText(API_URL + "?action=delete", { method:"POST", body: fd });
  if (!r.ok || !(r.json?.success)) return showToast("danger", "❌ Delete failed: " + (r.json?.error ?? r.text));
  showToast("success", "🗑 User deleted");
  loadUsers();
}

/* ===============================
   Init add/edit modal
=============================== */
function openAddFlow() {
  const form = document.getElementById("userForm");
  form.reset();

  // Reset hidden fields
  document.getElementById("userId").value = "";
  document.getElementById("remove_pic").value = "0";

  // Reset profile preview
  setProfilePreview(null);

  // Remove previous validation states if any
  form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));

  // Load roles
  loadRoles();

  // Show modal
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("userModal"));
  modal.show();

  // Focus first input after modal is shown
  const modalEl = document.getElementById("userModal");
  modalEl.addEventListener(
    "shown.bs.modal",
    () => {
      const firstInput = modalEl.querySelector('input[name="username"]');
      if (firstInput) firstInput.focus();
    },
    { once: true }
  );
}

/* ===============================
   Profile preview
=============================== */
function setProfilePreview(pic) {
  const preview = document.getElementById("profilePreview");
  const img = document.getElementById("profileImg");
  if (pic) { img.src = "/backend/uploads/profiles/" + pic;
  preview.style.display="block"; 
  document.getElementById("remove_pic").value="0"; }
  else { preview.style.display="none"; 
  document.getElementById("remove_pic").value="1"; }
}
/* ===============================
   Init table actions
=============================== */
/* ===============================
   Init table actions
=============================== */
function bindTableActions() {
  const table = document.getElementById("usersTable");
  if (!table) return;

  table.addEventListener("click", function (e) {

    let target = e.target;

    while (target && target !== table) {
      if (target.tagName === "BUTTON" && target.dataset.action) {
        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action === "edit") {
          handleEditClick(id);
        }

        if (action === "delete") {
          showConfirm(
            "Delete user " + id + "?",
            function () { deleteUser(id); },
            "delete"
          );
        }

        return;
      }

      target = target.parentElement;
    }

  });
}


/* ===============================
   Edit user
=============================== */
async function handleEditClick(id) {
  const r = await fetchJsonOrText(API_URL + "?action=fetch");
  const user = r.json?.find(u=>u.id==id);
  if (!user) return showToast("danger","❌ User not found");
  document.getElementById("userForm").reset();
  document.getElementById("userId").value = user.id;
  document.getElementById("username").value = user.username;
  document.getElementById("fullname").value = user.fullname;
  document.getElementById("email").value = user.email??"";
  document.getElementById("phone").value = user.phone??"";
  document.getElementById("password").value = "";
  document.getElementById("confirm_password").value = "";
  await loadRoles();
  document.getElementById("role_id").value = user.role_id;
  setProfilePreview(user.profile_pic);
  bootstrap.Modal.getOrCreateInstance(document.getElementById("userModal")).show();
}

// ===============================
// INIT FUNCTION (ORIGINAL LOGIC - SPA SAFE)
// ===============================
function createUserManagementComponent() {

  let mounted = false;

  function mount() {
    if (mounted) return;
    mounted = true;

    init();
  }

  function unmount() {
    mounted = false;
  }

  function init() {
    console.log("User Management Initialized");


  bindTableActions();

  // ===============================
  // FORM SUBMIT
  // ===============================
  const form = document.getElementById("userForm");
  if (form) {
    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      showConfirm("Save this user?", function () {
        saveUser(ev);
      }, "save");
    });
  }

  // ===============================
  // ADD BUTTON DEFAULT FOCUS + ENTER
  // ===============================
  const addBtn = document.getElementById("btnAdd");
  if (addBtn) {

    addBtn.focus();

    addBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        openAddFlow();

        const modalEl = document.getElementById("userModal");
        if (modalEl) {
          modalEl.addEventListener(
            "shown.bs.modal",
            function () {
              const firstInput = modalEl.querySelector('input[name="username"]');
              if (firstInput) firstInput.focus();
            },
            { once: true }
          );
        }
      }
    });

   addBtn.addEventListener("click", function (e) {
  e.preventDefault();
  e.stopPropagation();
  openAddFlow();
});

  }

  // ===============================
  // PHONE NORMALIZATION (+265)
  // ===============================
  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {

      let val = phoneInput.value.replace(/\D/g, '');

      if (val.startsWith('0')) {
        val = '265' + val.slice(1);
      }

      if (!val.startsWith('265')) {
        val = '265' + val;
      }

      val = val.slice(0, 12);

      phoneInput.value =
        '+' +
        val.slice(0, 3) + ' ' +
        val.slice(3, 6) + ' ' +
        val.slice(6, 9) + ' ' +
        val.slice(9, 12);
    });
  }

  // ===============================
  // REMOVE PROFILE BUTTON
  // ===============================
  const removePicBtn = document.getElementById("removePicBtn");
  if (removePicBtn) {
    removePicBtn.addEventListener("click", function () {
      setProfilePreview(null);
    });
  }

  // ===============================
  // TOGGLE PASSWORD
  // ===============================
  const togglePassword = document.getElementById("togglePassword");
  if (togglePassword) {
    togglePassword.addEventListener("click", function () {

      const input = document.getElementById("password");
      const icon = document.querySelector("#togglePassword i");

      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        if (icon) {
          icon.classList.remove("bi-eye");
          icon.classList.add("bi-eye-slash");
        }
      } else {
        input.type = "password";
        if (icon) {
          icon.classList.remove("bi-eye-slash");
          icon.classList.add("bi-eye");
        }
      }
    });
  }

  // ===============================
  // TOGGLE CONFIRM PASSWORD
  // ===============================
  const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener("click", function () {

      const input = document.getElementById("confirm_password");
      const icon = document.querySelector("#toggleConfirmPassword i");

      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        if (icon) {
          icon.classList.remove("bi-eye");
          icon.classList.add("bi-eye-slash");
        }
      } else {
        input.type = "password";
        if (icon) {
          icon.classList.remove("bi-eye-slash");
          icon.classList.add("bi-eye");
        }
      }
    });
  }

  // ===============================
  // FULL KEYBOARD NAVIGATION (IDENTICAL TO ORIGINAL)
  // ===============================
  const userModal = document.getElementById("userModal");

  if (userModal) {

    userModal.addEventListener("keydown", function (e) {

      const modal = e.currentTarget;

      const focusable = Array.from(
        modal.querySelectorAll(
          'input:not([type="hidden"]):not([id="profile_pic"]), select, textarea, button'
        )
      ).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });

      const index = focusable.indexOf(document.activeElement);
      if (index === -1) return;

      switch (e.key) {

        case "Enter":
          e.preventDefault();

          if (e.shiftKey) {

            const prev = focusable[index - 1];
            if (prev) {
              prev.focus();
              if (prev.tagName === "INPUT" && prev.type !== "button") {
                prev.select();
              }
            }

          } else {

            const next = focusable[index + 1];

            if (next) {
              next.focus();
              if (next.tagName === "INPUT" && next.type !== "button") {
                next.select();
              }
            } else {
              form.dispatchEvent(new Event("submit", { cancelable: true }));
            }
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          const down = focusable[index + 1] || focusable[0];
          down.focus();
          if (down.tagName === "INPUT" && down.type !== "button") {
            down.select();
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          const up = focusable[index - 1] || focusable[focusable.length - 1];
          up.focus();
          if (up.tagName === "INPUT" && up.type !== "button") {
            up.select();
          }
          break;

        case "Escape":
          e.preventDefault();
          bootstrap.Modal.getInstance(userModal)?.hide();
          break;
      }
    });
  }

  loadUsers();
  }

 return {
  init: mount,
  destroy: unmount
};
}
window.UserManagementPage = createUserManagementComponent();

