const API_BASE = "http://127.0.0.1:8000/api/v1"; // PRODUCTION URL

/**
 * Standard fetch wrapper to always include cookies and CSRF headers.
 */
async function fetchSecure(endpoint, options = {}) {
    options.credentials = "include";
    options.headers = {
        ...options.headers,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json"
    };
    return fetch(`${API_BASE}${endpoint}`, options);
}

/**
 * Core Initialization Function for Protected Pages.
 * Call this function when a protected page loads or refreshes.
 * It checks authentication, attempts to refresh if needed, 
 * and redirects to login if the user is unauthenticated.
 * 
 * @returns {Object|null} The session data if successful, null if redirected.
 */
async function init() {
    console.log("Init: Verifying secure session...");
    
    // 1. Try to access a protected endpoint
    let response = await fetchSecure("/auth/me");

    // 2. If unauthorized (access token expired or missing), attempt a refresh
    if (response.status === 401) {
        console.log("Init: Access token expired. Attempting secure refresh...");
        
        const refreshResponse = await fetchSecure("/auth/refresh", { method: "POST" });
        
        if (refreshResponse.ok) {
            console.log("Init: Refresh successful! New tokens acquired.");
            // Retry the original request
            response = await fetchSecure("/auth/me");
        } else {
            console.log("Init: Refresh failed (token revoked/expired). Redirecting to login.");
            window.location.href = "login.html";
            return null;
        }
    }

    // 3. If any other failure occurs (e.g. 403 Forbidden), redirect to login
    if (!response.ok) {
        console.log("Init: Authentication failed. Redirecting to login.");
        window.location.href = "login.html";
        return null;
    }

    // 4. Success! Return the data so the page can render
    console.log("Init: Authentication completely successful!");
    return await response.json();
}

async function logout() {
    await fetchSecure("/auth/logout", { method: "POST" });
    window.location.href = "login.html";
}
