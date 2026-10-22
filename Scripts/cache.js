export async function cachedFetch(key, url, options = {}) {
    const {
        compareFn = (a, b) => JSON.stringify(a) !== JSON.stringify(b)
    } = options;

    let cached = sessionStorage.getItem(key);
    let cachedData = cached ? JSON.parse(cached) : null;
    if (cachedData) {
        updateInBackground(cachedData);
        return cachedData;
    }

    // If no cache, fetch fresh immediately
    const fresh = await fetch(url).then(r => r.json());
    if (localStorage.getItem('sessionStorageAccepted')) save(fresh);
    return fresh;

    function save(data) {
        sessionStorage.setItem(key, JSON.stringify(data));
        sessionStorage.setItem(key + "-timestamp", Date.now());
    }

    async function updateInBackground(oldData) {
        try {
            const freshData = await fetch(url).then(r => r.json());
            if (compareFn(oldData, freshData)) {
                save(freshData);
                window.dispatchEvent(new CustomEvent(key + "-updated", { detail: freshData }));
            }
        } catch (err) {
            console.warn("Background cache update failed:", key, err);
        }
    }
}
