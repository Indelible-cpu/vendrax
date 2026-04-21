async function syncOfflineSales() {

    if (!navigator.onLine) return;

    try {

        const sales = await OfflineDB.getPendingSales();

        if (!sales.length) return;

        console.log("Offline sales to sync:", sales.length);

        for (const sale of sales) {

            // skip if already syncing
            if (sale.syncing) continue;

            // stop retrying after 5 failures
            if ((sale.retry_count || 0) >= 5) {
                console.warn("Max retries reached for sale:", sale.id);
                continue;
            }

            try {

                // lock sale
                await OfflineDB.markSyncing(sale.id);

                const res = await fetch("/backend/create_sale.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify(sale.data)   // IMPORTANT
                });

                if (res.ok) {

                    await OfflineDB.markSynced(sale.id);

                    console.log("Synced sale:", sale.id);

                } else {

                    const errText = await res.text();

                    await OfflineDB.incrementRetry(sale.id, errText);

                }

            } catch (e) {

                console.error("Sync failed:", sale.id, e);

                await OfflineDB.incrementRetry(sale.id, e.message);

                break; // stop loop if server unreachable

            }

        }

    } catch (err) {

        console.error("Offline sync error:", err);

    }

}