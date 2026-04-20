/* =====================================
   SYSTEM STATUS MONITOR
===================================== */
async function updateSystemStatus() {
  const internet = document.getElementById("statusInternet");
  const server = document.getElementById("statusServer");
  const session = document.getElementById("statusSession");

  const connectionDot = document.getElementById("connectionDot");
  const connectionText = document.getElementById("connectionText");

  const online = navigator.onLine;

  // -------------------------------
  // INTERNET STATUS
  // -------------------------------
  if (internet) internet.className = online ? "status-dot status-online" : "status-dot status-offline";
  if (connectionDot) connectionDot.className = online ? "status-dot status-online" : "status-dot status-offline";
  if (connectionText) connectionText.textContent = online ? "Online" : "Offline";

  // -------------------------------
  // SERVER STATUS
  // -------------------------------
  if (server && online) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/backend/ping.php", {
        credentials: "same-origin",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      server.className = res.ok ? "status-dot status-online" : "status-dot status-offline";
    } catch {
      server.className = "status-dot status-offline";
    }
  }

  // -------------------------------
  // SESSION STATUS
  // -------------------------------
  if (session && online) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/backend/session_check.php", {
        credentials: "same-origin",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      session.className = res.ok ? "status-dot status-online" : "status-dot status-warning";
    } catch {
      session.className = "status-dot status-offline";
    }
  }
}

/* =====================================
   START MONITOR
===================================== */
// run once
updateSystemStatus();
// repeat every 20 seconds
setInterval(updateSystemStatus, 20000);
// update on network changes
window.addEventListener("online", updateSystemStatus);
window.addEventListener("offline", updateSystemStatus);

/* =====================================
   MOBILE SECONDARY NAV SWIPE
===================================== */
if (window.innerWidth <= 768) {
  (function () {
    let startY = 0;
    let endY = 0;

    const secondaryNav = document.getElementById("secondaryNav");
    if (!secondaryNav) return;

    // -------------------------------
    // SWIPE UP / DOWN
    // -------------------------------
    document.addEventListener("touchstart", (e) => {
      startY = e.touches[0].clientY;
    });

    document.addEventListener("touchmove", (e) => {
      endY = e.touches[0].clientY;
    });

    document.addEventListener("touchend", () => {
      const diff = startY - endY;
      if (diff > 80) secondaryNav.classList.add("show");   // swipe up → open
      if (diff < -80) secondaryNav.classList.remove("show"); // swipe down → close
      startY = 0;
      endY = 0;
    });

    // -------------------------------
    // TAP OUTSIDE → CLOSE
    // -------------------------------
    document.addEventListener("touchstart", (e) => {
      if (!e.target.closest("#secondaryNav") && secondaryNav.classList.contains("show")) {
        secondaryNav.classList.remove("show");
      }
    });
  })();
}