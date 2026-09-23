const DEFAULT_TIMEOUT_MS = 8000;
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 15000;

function requestTimeoutMs() {
  const configured = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS);
  return Number.isInteger(configured) && configured >= MIN_TIMEOUT_MS && configured <= MAX_TIMEOUT_MS
    ? configured
    : DEFAULT_TIMEOUT_MS;
}

async function requestGeminiJson(url, options) {
  const timeoutMs = requestTimeoutMs();
  const controller = new AbortController();
  // Keep this timer referenced: offline mocks may otherwise leave no event-loop
  // work for Node to wait on while the request Promise is still pending.
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json();
    return { response, data };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Gemini request timed out after ${timeoutMs} ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { requestGeminiJson };
