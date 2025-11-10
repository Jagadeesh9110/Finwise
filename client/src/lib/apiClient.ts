// This utility function is the central point for all API communication
// between your React frontend and your Node.js backend. It's a generic
// wrapper around the native `fetch` API to standardize requests and error handling.

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Set up the default headers for all outgoing requests.
  // We will primarily be working with JSON data, so we set this as a default.
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Configure the request. The 'credentials: "include"' option is the
  // most important part for our httpOnly cookie authentication strategy.
  // It tells the browser to automatically send any relevant cookies
  // (like our auth cookie) with this request. Without this, the backend
  // would never receive the authentication cookie.
  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  // Construct the full API URL. The '/api' prefix is a common convention.
  // In `vite.config.ts`, we've set up a proxy to forward any request
  // starting with '/api' to our backend server (e.g., http://localhost:3000).
  const response = await fetch(`/api${endpoint}`, config);

  // This is our central error handling logic. It's crucial for a good user experience.
  // If the server responds with an error status (e.g., 401 Unauthorized, 404 Not Found),
  // we need to handle it gracefully instead of letting the application crash.
  if (!response.ok) {
    // We try to parse a JSON error message from the response body.
    // A well-designed backend will send a helpful message here (e.g., "Invalid password").
    // The .catch() block handles cases where the server sends a non-JSON error
    // (like a plain text "500 Internal Server Error"), preventing another crash.
    const errorData = await response.json().catch(() => ({
      message: `Request failed with status: ${response.status}`,
    }));

    // We throw a new Error with the message from the server. This allows our
    // React components (or hooks like `useAuth`) to use a try/catch block
    // to handle API errors and display appropriate messages to the user.
    throw new Error(errorData.message || "An unknown API error occurred");
  }

  // If the request was successful (status 200-299), we parse the JSON from the
  // response body and return it. The generic type <T> ensures that the caller
  // gets back a fully typed object, which provides great autocompletion and
  // prevents bugs in the rest of the application.
  return response.json();
}

// Add these helper functions to your existing apiClient.ts

export async function processAICommand(command: string): Promise<any> {
  return apiClient("/process-command", {
    method: "POST",
    body: JSON.stringify({ command }),
  });
}

export async function processScenario(parameters: any): Promise<any> {
  return apiClient("/scenarios/what-if", {
    method: "POST",
    body: JSON.stringify({ parameters }),
  });
}

export async function getFinancialProfile(userId: string): Promise<any> {
  return apiClient(`/financial-profiles/${userId}`);
}

export async function getAgentOutputs(userId: string): Promise<any> {
  return apiClient(`/agent-outputs/${userId}`);
}
