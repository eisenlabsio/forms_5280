#!/bin/bash

curl -L -H "Content-Type: application/json" -d '{
  "responseSheetId": "1oe2KBHAJGtzd7IPOIYdekFg_pli6PQj5Fv8yW9c1ETo",
  "quizSheetId": "myTestQuiz123",
  "userAnswers": {
    "שאלה 1": "תשובה לדוגמא 1",
    "question2": "Example answer for question 2"
  },
  "metadata": {
    "name": "שם לדוגמא",
    "מספר אישי": "987654321",
    "userAgent": "Mozilla/5.0 (Testing with cURL)",
    "latitude": "32.0853",
    "longitude": "34.7818",
    "browser": "cURL/Tester",
    "os": "Linux/Test",
    "someOtherMetadata": "This will go into the 'metadata' column if no specific column for it exists"
  }
}' "https://script.google.com/macros/s/AKfycbw7GY3nKSWFM5rOFCesRmMdNVrIum1rAJwQa-bFsUI/dev"
