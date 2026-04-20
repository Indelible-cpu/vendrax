document.addEventListener("DOMContentLoaded", () => {
    // ===== SLOGAN ROTATION =====
    const slogans = [
        "Empowering ideas through code.",
        "Technology built for growth.",
        "Smart systems. Real impact.",
        "Offline power for modern business."
    ];

    let i = 0;
    const el = document.getElementById("slogan");
    if (el) {
        function rotate() {
            el.style.opacity = 0;
            setTimeout(() => {
                el.textContent = slogans[i];
                el.style.opacity = 1;
                i = (i + 1) % slogans.length;
            }, 400);
        }
        rotate(); // initial display
        setInterval(rotate, 7000); // rotate every 7 seconds
    }

    // ===== MODULE CARD ACTIONS =====
    function handleAction(action) {
        switch(action) {
            case "refresh": location.reload(); break;
            case "logout": window.location.href = "logout.php"; break;
            case "theme":
                document.body.dataset.bsTheme =
                    document.body.dataset.bsTheme === "dark" ? "light" : "dark";
                break;
            case "menu":
                document.querySelector(".navbar-toggler")?.click();
                break;
            default:
                if (typeof loadSection === "function") loadSection(action);
        }
    }

    document.addEventListener("click", (e) => {
        const card = e.target.closest(".action-card");
        if (card) handleAction(card.dataset.action);
    });

    // ===== MODULE GRID NAVIGATION =====
    const moduleCards = Array.from(document.querySelectorAll(".module-card-compact"));

    function getCols() {
        if (window.innerWidth >= 992) return 4; // desktop
        if (window.innerWidth >= 768) return 2; // tablet
        return 1; // mobile
    }

    function focusCard(index) {
        if (moduleCards[index]) moduleCards[index].focus();
    }

    document.addEventListener("keydown", (e) => {
        const active = document.activeElement;
        if (!active.classList.contains("module-card-compact")) return;

        const index = moduleCards.indexOf(active);
        if (index === -1) return;

        const cols = getCols();

        switch(e.key) {
            case "ArrowRight": e.preventDefault(); focusCard((index+1) % moduleCards.length); break;
            case "ArrowLeft": e.preventDefault(); focusCard((index-1+moduleCards.length) % moduleCards.length); break;
            case "ArrowDown": e.preventDefault(); focusCard((index+cols) % moduleCards.length); break;
            case "ArrowUp": e.preventDefault(); focusCard((index-cols+moduleCards.length) % moduleCards.length); break;
            case "Enter": e.preventDefault(); handleAction(active.dataset.action); break;
            case "Escape": e.preventDefault(); active.blur(); break;
        }
    });

    // Optional: tap support for touch devices
    moduleCards.forEach(card => card.addEventListener("touchstart", () => card.focus()));
});