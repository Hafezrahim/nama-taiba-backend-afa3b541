
export const submitRequestQuote = async (formData: Record<string, string>) => {
  // In a real implementation, we would use a proper API to submit to Google Sheets
  // This is a placeholder for demonstration purposes
  console.log("Quote request submitted:", formData);
  // For demo purposes we'll just return success
  return { success: true };
};
