// Apps Script URL (After Deploy as Web App)
// Paste this code into Google Apps Script connected to your Spreadsheet.

const SPREADSHEET_ID = '1pE_YGmKFZNUz8ow2baGfxw3EMH0PwOQeRmOWVVB9Itg';
const SHEET_DATA = 'ops-student-data';
const SHEET_RESULT = 'ops-student-result-ghs2a';

// Handling GET Requests (For Login / Check Email)
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'login') {
    const email = (e.parameter.email || '').toLowerCase().trim();
    if (!email) {
      return respond({ success: false, message: "Email kosong" });
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
    if (!sheet) {
      return respond({ success: false, message: "Sheet data tidak ditemukan" });
    }
    
    // Header is on row 1: No | Student's Name | Student's School | Student's Academia Email
    const data = sheet.getDataRange().getValues();
    
    // Find the email
    for (let i = 1; i < data.length; i++) {
      let rowEmail = String(data[i][3]).toLowerCase().trim();
      if (rowEmail === email) {
        return respond({
          success: true,
          name: data[i][1],
          school: data[i][2],
          email: data[i][3]
        });
      }
    }
    
    return respond({ success: false, message: "Email tidak terdaftar" });
  }
  
  return respond({ success: false, message: "Invalid action" });
}

// Handling POST Requests (For Saving/Updating Data Progressively)
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ success: false, message: "Invalid JSON" });
  }
  
  const email = (payload.Students_Email || '').toLowerCase().trim();
  if (!email) {
    return respond({ success: false, message: "Email missing from payload" });
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_RESULT);
  
  if (!sheet) {
    return respond({ success: false, message: "Sheet result tidak ditemukan" });
  }

  // The 33 Columns defined:
  const headers = [
    "Timestamp", "Students_Name", "Students_School", "Students_Email",
    "V2_Q1_Att", "V2_Q2_Att", "V2_Q3_Att", "V2_Q4_Att", "V2_Q5_Att", 
    "V2_Q6_Att", "V2_Q7_Att", "V2_Q8_Att", "V2_Q9_Att", "V2_Q10_Att",
    "V3_Q1_Ans", "V3_Q1_Att", "V3_Q2_Ans", "V3_Q2_Att", "V3_Q3_Att",
    "V4_Q1_Ans", "V4_Q1_Att", 
    "V5_Q1_Ans", "V5_Q1_Att", "V5_Q2_Ans", "V5_Q2_Att", "V5_Q3_Ans", "V5_Q3_Att",
    "V6_Needs_Ans", "V6_Wants_Ans", "V6_IDE_Code", "V6_IDE_Att",
    "Final_Project_Code", "Final_Project_Attempts", "Final_Project_Score"
  ];
  
  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  
  // Find if user already exists to update, or append new row
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Start from 1 to skip header
  for (let i = 1; i < data.length; i++) {
    let rowEmail = String(data[i][3]).toLowerCase().trim();
    if (rowEmail === email) {
      rowIndex = i + 1; // Google Sheets is 1-indexed
      break;
    }
  }
  
  // Map payload to array
  const rowData = headers.map(header => {
    if (header === "Timestamp") {
      return new Date();
    }
    return payload[header] !== undefined ? payload[header] : "";
  });
  
  if (rowIndex > -1) {
    // UPDATE existing row
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // APPEND new row
    sheet.appendRow(rowData);
  }
  
  return respond({ success: true, message: "Data saved successfully" });
}

// Helper to return JSON with CORS headers
function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
