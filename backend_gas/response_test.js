function testAnswer() {
  let response = '{"quizSheetId":"1H5gy4tlJqZmyLSEREx4jTR9UgzAbY9xzUxicCtnmiKY","responseSheetId":"1kqzFexENS8pysXXJ6TZqvscrC3MV6QpNWpU1o2wgnKw","userAnswers":{"Q1":"h2o","Q2":"Mars","Q3":"12","Q4":"3","F1":"2026-02-11","F2":"wer","F3":"13:03","F4":"2026-01-08T11:03","F5":"2134"},"metadata":{"userAgent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1","timestamp":"2026-01-19T09:03:47.690Z","latitude":32.08150493420935,"longitude":34.79514898300031,"accuracy":200.5677490234375,"locationStatus":"granted"}}';
  
  let e = {
    postData: {
      contents: response
    }
  }

  doPost(e);
}
