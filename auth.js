// const API_BASE = "http://localhost:8000/api/v1"; // PRODUCTION URL
// // const API_BASE = "https://dt20tzx0-8000.inc1.devtunnels.ms/api/v1"; // PRODUCTION URL

// /**
//  * Standard fetch wrapper to always include cookies and CSRF headers.
//  */
// async function fetchSecure(endpoint, options = {}) {
//     options.credentials = "include";
//     options.headers = {
//         ...options.headers,
//         "X-Requested-With": "XMLHttpRequest",
//         "Content-Type": "application/json"
//     };
//     return fetch(`${API_BASE}${endpoint}`, options);
// }

// /**
//  * Core Initialization Function for Protected Pages.
//  * Call this function when a protected page loads or refreshes.
//  * It checks authentication, attempts to refresh if needed, 
//  * and redirects to login if the user is unauthenticated.
//  * 
//  * @returns {Object|null} The session data if successful, null if redirected.
//  */
// async function init() {
//     console.log("Init: Verifying secure session...");

//     // 1. Try to access a protected endpoint
//     let response = await fetchSecure("/auth/me");

//     // 2. If unauthorized (access token expired or missing), attempt a refresh
//     if (response.status === 401) {
//         console.log("Init: Access token expired. Attempting secure refresh...");

//         const refreshResponse = await fetchSecure("/auth/refresh", { method: "POST" });

//         if (refreshResponse.ok) {
//             console.log("Init: Refresh successful! New tokens acquired.");
//             // Retry the original request
//             response = await fetchSecure("/auth/me");
//         } else {
//             console.log("Init: Refresh failed (token revoked/expired). Redirecting to login.");
//             window.location.href = "login.html";
//             return null;
//         }
//     }

//     // 3. If any other failure occurs (e.g. 403 Forbidden), redirect to login
//     if (!response.ok) {
//         console.log("Init: Authentication failed. Redirecting to login.");
//         window.location.href = "login.html";
//         return null;
//     }

//     // 4. Success! Return the data so the page can render
//     console.log("Init: Authentication completely successful!");
//     return await response.json();
// }

// async function logout() {
//     await fetchSecure("/auth/logout", { method: "POST" });
//     window.location.href = "login.html";
// }


const API_BASE = "http://localhost:8000/api/v1";

// const API_BASE = "https://dt20tzx0-8000.inc1.devtunnels.ms/api/v1";

let isRefreshing = false;

/**
 * Secure Fetch Wrapper
 * - Includes cookies automatically
 * - Handles expired access tokens
 * - Refreshes session automatically
 * - Retries failed requests
 * - Redirects to login if authentication fails
 */
async function fetchSecure(endpoint, options = {}) {

    options.credentials = "include";

    options.headers = {
        ...options.headers,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json"
    };

    let response;

    try {

        response = await fetch(
            `${API_BASE}${endpoint}`,
            options
        );

    } catch (error) {

        console.error("Network Error:", error);

        throw error;
    }

    /**
     * Access token expired or missing
     */
    if (response.status === 401) {

        console.log("Access token invalid. Attempting refresh...");

        /**
         * Prevent multiple refresh calls simultaneously
         */
        if (!isRefreshing) {

            isRefreshing = true;

            try {

                const refreshResponse = await fetch(
                    `${API_BASE}/auth/refresh`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "X-Requested-With": "XMLHttpRequest"
                        }
                    }
                );

                isRefreshing = false;

                /**
                 * Refresh failed
                 */
                if (!refreshResponse.ok) {

                    console.log("Refresh failed. Redirecting to login.");

                    window.location.href = "login.html";

                    return null;
                }

                console.log("Refresh successful.");

            } catch (error) {

                isRefreshing = false;

                console.error("Refresh Error:", error);

                window.location.href = "login.html";

                return null;
            }
        }

        /**
         * Retry original request
         */
        response = await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,
                credentials: "include"
            }
        );

        /**
         * Retry still unauthorized
         */
        if (response.status === 401) {

            console.log("Retry failed. Redirecting to login.");

            window.location.href = "login.html";

            return null;
        }
    }

    return response;
}

/**
 * Protected Page Initialization
 * Verifies authentication before rendering page
 */
async function init() {

    console.log("Checking secure session...");

    try {

        const response = await fetchSecure("/auth/me");

        if (!response || !response.ok) {

            console.log("Authentication failed.");

            window.location.href = "login.html";

            return null;
        }

        const data = await response.json();

        console.log("Authentication successful.");

        return data;

    } catch (error) {

        console.error("Init Error:", error);

        window.location.href = "login.html";

        return null;
    }
}

/**
 * Logout User
 */
async function logout() {

    try {

        await fetchSecure(
            "/auth/logout",
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.error("Logout Error:", error);
    }

    window.location.href = "login.html";
}