
export const API_KEY = "AIzaSyCsXCrm9P7UzWgn0drIe_GV8gnMKV9tspQ";
export const SHEET_ID = "1nFa4v4h6vImg7ubF5uNhtsVOfzEXqwzbhICVofYNa6Y";

export const fetchSheetData = async (sheetName: string) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching ${sheetName} data`);
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error(`Error fetching ${sheetName} data:`, error);
    return [];
  }
};
