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
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal });
    const data = await response.json();
    return { response, data };
  } catch (error) {
    if (signal.aborted) {
      throw new Error(`Gemini request timed out after ${timeoutMs} ms.`);
    }
    throw error;
  }
}

module.exports = { requestGeminiJson };
