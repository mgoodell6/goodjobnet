/**
 * Global fetch wrapper that automatically triggers connection lost dialog on errors
 * Usage: Pass the triggerConnectionLost function from useConnectionCheck hook
 * 
 * Example:
 * const { triggerConnectionLost } = useConnectionCheck();
 * const response = await fetchWithErrorHandling('/api/endpoint', options, triggerConnectionLost);
 */
export const fetchWithErrorHandling = async (url, options = {}, triggerConnectionLost) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    console.error('Fetch error:', err);
    if (triggerConnectionLost) {
      triggerConnectionLost();
    }
    throw err;
  }
};
