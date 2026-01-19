function createFormSummaryDoc(formId, targetFolderId) {
  // Open the Google Form by ID
  var form = FormApp.openById(formId);
  var formTitle = form.getTitle();
  var formDescription = form.getDescription();
  Logger.log("Form Title: " + formTitle);
  if (formDescription) {
    Logger.log("Form Description: " + formDescription);
  }

  // Get the target folder
  var targetFolder = DriveApp.getFolderById(targetFolderId);
  Logger.log("Target Folder: " + targetFolder.getName());

  // Create a new Google Document
  var doc = DocumentApp.create(formTitle + " - Summary");
  var docId = doc.getId();
  var body = doc.getBody();
  Logger.log("Document created with ID: " + docId);

  // Move the new document to the target folder
  var file = DriveApp.getFileById(docId);
  targetFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file); // Remove from root if it was created there by default
  Logger.log("Document moved to folder: " + targetFolder.getName());

  // Set document direction to RTL for Hebrew
  // body.setDirection(DocumentApp.TextDirection.RIGHT_TO_LEFT);

  // Add Form Title
  body.appendParagraph(formTitle).setHeading(DocumentApp.ParagraphHeading.TITLE).setLeftToRight(false);
  
  // Add Form Description
  if (formDescription) {
    body.appendParagraph(formDescription).setHeading(DocumentApp.ParagraphHeading.SUBTITLE).setLeftToRight(false);
  }if (DocumentApp.Direction && DocumentApp.Direction.RTL) {
    body.appendParagraph("").setLeftToRight(false); // Add a blank line
  } else {
    Logger.log("Warning: DocumentApp.Direction.RTL is undefined. Skipping blank line direction setting.");
    body.appendParagraph(""); // Add a blank line
  }

  // Iterate through form items (questions)
  var items = form.getItems();
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var itemTitle = item.getTitle();
    var itemType = item.getType();

    // Add question title
    // if (DocumentApp.Direction && DocumentApp.Direction.RTL) {
    //   body.appendParagraph(itemTitle).setHeading(DocumentApp.ParagraphHeading.HEADING3).setLeftToRight(false);
    // } else {
    //   Logger.log("Warning: DocumentApp.Direction.RTL is undefined. Skipping item title direction setting for: " + itemTitle);
      body.appendParagraph(itemTitle).setHeading(DocumentApp.ParagraphHeading.HEADING3).setLeftToRight(false);
    // }

    switch (itemType) {
      case FormApp.ItemType.TEXT:
      case FormApp.ItemType.PARAGRAPH_TEXT:
        // For text questions, add underscores
        // if (DocumentApp.Direction && DocumentApp.Direction.RTL) {
        //   body.appendParagraph("_________________________").setLeftToRight(false);
        // } else {
          Logger.log("Warning: DocumentApp.Direction.RTL is undefined. Skipping text input direction setting.");
          body.appendParagraph("_________________________").setLeftToRight(false);
        // }
        break;
      case FormApp.ItemType.MULTIPLE_CHOICE:
        var mcItem = item.asMultipleChoiceItem();
        var choices = mcItem.getChoices();
        for (var j = 0; j < choices.length; j++) {
          body.appendParagraph("  [ ] " + choices[j].getValue()).setLeftToRight(false);
        }
        break;
      case FormApp.ItemType.CHECKBOX:
        var cbItem = item.asCheckboxItem();
        var choices = cbItem.getChoices();
        for (var j = 0; j < choices.length; j++) {
          body.appendParagraph("  [ ] " + choices[j].getValue()).setLeftToRight(false);
        }
        break;
      // You can add more item types as needed (e.g., LIST, SCALE, GRID)
      default:
        body.appendParagraph("  [Unsupported Question Type: " + itemType.toString() + "]").setLeftToRight(false);
        break;
    }
    body.appendParagraph("").setLeftToRight(false); // Add a blank line after each question
  }

  doc.saveAndClose();
  
  return file.getUrl();
}

const FORMS = {
  "neshek_safety": "1Hq-Y2aXYYKc7GWLVx70OPNLJB5yr9rfq_Uy7bBMH_yc",
  "mac_porek": "1ciphVDdnpQKL7h7G4bxL_7Cq-6cdfECqb0flEnnrhLQ",
  "home_with_neshek": "1znf3aBrN7rGmAQYsBE7n1KtqstF7TYy81iA-z1QMylM",
  "amral": "11Lq0W7yhu_YMIKIpz3A06pUwavl41uQpFAppH1LA0E8"
}

const TARGET_DIRECTORY = "1N7WcpMWQfSNwseTedE5SB8H3BL_5OhZj";

/**
 * This function serves as a wrapper to run createFormSummaryDoc.
 * Replace the placeholder IDs with your actual Google Form ID and target Google Drive Folder ID.
 */
function runFormSummaryGenerator() {
  var myFormId = FORMS.neshek_safety; // <<< REPLACE WITH YOUR GOOGLE FORM ID
  // var myFormId = FORMS.mac_porek; // <<< REPLACE WITH YOUR GOOGLE FORM ID
  // var myFormId = FORMS.home_with_neshek; // <<< REPLACE WITH YOUR GOOGLE FORM ID
  // var myFormId = FORMS.amral; // <<< REPLACE WITH YOUR GOOGLE FORM ID
  
  var myTargetFolderId = TARGET_DIRECTORY; // <<< REPLACE WITH YOUR GOOGLE DRIVE FOLDER ID

  if (myFormId === "YOUR_GOOGLE_FORM_ID_HERE" || myTargetFolderId === "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE") {
    Logger.log("Please replace 'YOUR_GOOGLE_FORM_ID_HERE' and 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE' with actual IDs before running.");
    return;
  }

  try {
    var docUrl = createFormSummaryDoc(myFormId, myTargetFolderId);
    Logger.log("Document created successfully: " + docUrl);
  } catch (e) {
    Logger.log("Error creating document: " + e.message);
  }
}
