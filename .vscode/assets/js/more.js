// more.js

function initMorePage() {

  const wrapper = document.getElementById("morePageWrapper");
  if (!wrapper) return;

  const tabs = ["profile", "about", "faq", "troubleshooting"];
 const tabCache = {};
  function switchTab(tab) {

    /* remove active button */
    wrapper.querySelectorAll("#moreTabs .nav-link")
      .forEach(btn => btn.classList.remove("active"));

    const activeBtn = wrapper.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    /* hide all tab content */
    wrapper.querySelectorAll(".more-tab")
      .forEach(t => t.classList.add("d-none"));

    const target = wrapper.querySelector("#" + tab + "Tab");
    if (target) target.classList.remove("d-none");

    /* dynamic page loading */

    if (tab === "profile")
      loadMorePage("profileTab", "profile.php");

    if (tab === "about")
      loadMorePage("aboutTab", "about.php");

    if (tab === "faq")
      loadMorePage("faqTab", "faq.php");

    if (tab === "troubleshooting")
      loadMorePage("troubleshootingTab", "troubleshooting.php");

  }

  async function loadMorePage(id, file) {

    const container = wrapper.querySelector("#" + id);
if (!container) return;

if (tabCache[file]) {
  container.innerHTML = tabCache[file];
  return;
}

    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>
    `;

    try {

      const res = await fetch("/pages/" + file, {
        credentials: "same-origin"
      });

      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      const html = await res.text();

     container.innerHTML = html;
tabCache[file] = html;

    } catch (err) {

      container.innerHTML = `
        <div class="alert alert-danger m-3">
          Failed to load <strong>${file}</strong>
        </div>
      `;

      console.error("More page load error:", err);

    }

  }

  function handleKeyNav(e) {

    if (!document.getElementById("morePageWrapper")) return;

    const tag = document.activeElement.tagName.toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return;

    const activeBtn = wrapper.querySelector("#moreTabs .nav-link.active");
    const currentTab = activeBtn ? activeBtn.dataset.tab : "profile";

    let index = tabs.indexOf(currentTab);

    if (e.key === "ArrowRight") {
      index = (index + 1) % tabs.length;
      switchTab(tabs[index]);
    }

    if (e.key === "ArrowLeft") {
      index = (index - 1 + tabs.length) % tabs.length;
      switchTab(tabs[index]);
    }

    if (e.key === "1") switchTab("profile");
    if (e.key === "2") switchTab("about");
    if (e.key === "3") switchTab("faq");
    if (e.key === "4") switchTab("troubleshooting");

  }

  /* Prevent duplicate listeners (SPA safe) */

  wrapper.querySelectorAll("#moreTabs .nav-link")
    .forEach(btn => {
      const clone = btn.cloneNode(true);
      btn.replaceWith(clone);
    });

  wrapper.querySelectorAll("#moreTabs .nav-link")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab);
      });
    });

  document.removeEventListener("keydown", handleKeyNav);
  document.addEventListener("keydown", handleKeyNav);

  /* default tab */
  switchTab("profile");

}

/* SPA MODULE EXPORT */
window.MorePage = {
  init() {
    initMorePage();
  },
  destroy() {}
};