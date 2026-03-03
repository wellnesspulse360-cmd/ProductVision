
import { CampaignItem } from "../types";

// Exporting SHEET_ID so it can be used in other components for display or reference
export const SHEET_ID = '1IXb-CFqHLfniN3DgI-X1FesMQE7qi-gNdNfrQNkXVqI';

/**
 * Fetches campaign data from the specific Google Sheet.
 * Column mapping (0-indexed):
 * B (1): URL
 * D (3): Affiliate Link
 * E (4): Status (Published or empty)
 * G (6): Article URL
 * M (12): Instructions
 */
export const fetchCampaignsFromSheet = async (): Promise<CampaignItem[]> => {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    // The response is wrapped in a function call: google.visualization.Query.setResponse({...});
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const json = JSON.parse(jsonStr);
    
    const rows = json.table.rows;
    const campaigns: CampaignItem[] = [];

    rows.forEach((row: any, index: number) => {
      // Column E is status (index 4)
      const statusValue = row.c[4]?.v || "";
      const isEligible = statusValue.toLowerCase() === "published" || statusValue === "";

      if (isEligible) {
        campaigns.push({
          id: `row-${index}`,
          url: row.c[1]?.v || "",
          affiliateLink: row.c[3]?.v || "",
          status: statusValue,
          articleUrl: row.c[6]?.v || "",
          instructions: row.c[12]?.v || "",
          rowIndex: index
        });
      }
    });

    return campaigns;
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw new Error("Could not fetch campaigns from Google Sheet. Ensure the sheet is shared as 'Anyone with the link can view'.");
  }
};

/**
 * Sends data to a Google Apps Script Web App to append to a Google Sheet.
 */
export const saveToGoogleSheets = async (
  scriptUrl: string,
  data: {
    name: string;
    url: string;
    affiliateLink: string;
  }
) => {
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain', 
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (result.result !== 'success') {
    throw new Error(result.error || 'Failed to save to sheet');
  }

  return result;
};

export const generateGoogleAppsScriptCode = () => {
  return `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Add Header if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Product Name", "Product URL", "Affiliate Link"]);
    }
    
    // Append Data
    sheet.appendRow([new Date(), data.name, data.url, data.affiliateLink]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
};
