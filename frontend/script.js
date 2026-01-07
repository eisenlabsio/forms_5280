// Global variables for content and quiz data
let contentData = {};
let masterSheetId = ''; // This will be obtained from URL parameter
const contentSheetId = 'YOUR_CONTENT_SHEET_ID_HERE'; // *** IMPORTANT: Replace with actual Content Sheet ID ***
const googleSheetsBaseUrl = 'https://docs.google.com/spreadsheets/d/';
const gasWebAppLink = 'YOUR_GAS_WEB_APP_URL_HERE'; // *** IMPORTANT: Replace with your deployed GAS Web App URL ***

// Helper function to parse CSV text into an array of objects
async function parseCSV(csvText) {
    const lines = csvText.split('\\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
            const item = {};
            for (let j = 0; j < headers.length; j++) {
                item[headers[j].trim()] = values[j].trim();
            }
            data.push(item);
        }
    }
    return data;
}

// Function to fetch content from the Content Google Sheet
async function fetchContentSheet() {
    try {
        const response = await fetch(`${googleSheetsBaseUrl}${contentSheetId}/gviz/tq?tqx=out:csv&gid=0`); // Assuming content is on gid=0
        const csvText = await response.text();
        const parsedData = await parseCSV(csvText);

        contentData = {};
        parsedData.forEach(item => {
            if (item.Key && item.Hebrew) { // Assuming 'Key' and 'Hebrew' columns exist
                contentData[item.Key] = item.Hebrew;
            }
        });
        applyContent(); // Apply content after fetching
    } catch (error) {
        console.error('Error fetching content sheet:', error);
        // Fallback or display error message
    }
}

// Function to apply fetched content to HTML elements
function applyContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (contentData[key]) {
            element.textContent = contentData[key];
        }
    });
}

// Function to get URL query parameters
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
            params[key] = decodeURIComponent(value);
        }
    });
    return params;
}

// Function to fetch master sheet data
async function fetchMasterSheet(sheetId) {
    try {
        // Assuming master sheet is always gid=0
        const response = await fetch(`${googleSheetsBaseUrl}${sheetId}/gviz/tq?tqx=out:csv&gid=0`);
        const csvText = await response.text();
        const masterSheetData = await parseCSV(csvText);
        console.log('Master Sheet Data:', masterSheetData);
        renderQuizSelection(masterSheetData); // Calling the implemented function
    } catch (error) {
        console.error('Error fetching master sheet:', error);
        // Display error message using contentData
        const quizSelection = document.getElementById('quiz-selection');
        quizSelection.innerHTML = `<p>${contentData['error_fetching_master_sheet'] || 'Error loading quizzes.'}</p>`;
    }
}

// Function to render the quiz selection list
function renderQuizSelection(quizzes) {
    const quizListDiv = document.getElementById('quiz-list');
    quizListDiv.innerHTML = ''; // Clear previous list

    if (quizzes.length === 0) {
        quizListDiv.innerHTML = `<p>${contentData['no_quizzes_available'] || 'No quizzes available.'}</p>`;
        return;
    }

    quizzes.forEach(quiz => {
        const quizCard = document.createElement('div');
        quizCard.classList.add('quiz-card');
        quizCard.setAttribute('data-gid', quiz.GID);
        quizCard.setAttribute('data-response-sheet-id', quiz['Response Sheet ID'] || ''); // Store response sheet ID

        const title = document.createElement('h3');
        title.textContent = quiz['Quiz Title'];
        quizCard.appendChild(title);

        const description = document.createElement('p');
        description.textContent = quiz['Quiz Description'];
        quizCard.appendChild(description);

        // Pass gid and responseSheetId to onQuizSelected
        quizCard.addEventListener('click', () => onQuizSelected(quiz.GID, quiz['Response Sheet ID']));
        quizListDiv.appendChild(quizCard);
    });

    document.getElementById('quiz-selection').style.display = 'block';
    document.getElementById('quiz-display').style.display = 'none';
}

// Function to handle quiz selection
function onQuizSelected(gid, responseSheetId) {
    document.getElementById('quiz-selection').style.display = 'none';
    document.getElementById('quiz-display').style.display = 'block';
    fetchQuiz(masterSheetId, gid, responseSheetId); // Calling the implemented function
}

// Function to fetch individual quiz data
async function fetchQuiz(sheetId, gid, responseSheetId) {
    try {
        const response = await fetch(`${googleSheetsBaseUrl}${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
        const csvText = await response.text();
        const quizData = await parseCSV(csvText);
        console.log('Quiz Data:', quizData);
        renderQuiz(quizData, responseSheetId); // Calling the implemented function
    } catch (error) {
        console.error('Error fetching quiz:', error);
        const quizDisplay = document.getElementById('quiz-display');
        quizDisplay.innerHTML = `<p>${contentData['error_fetching_quiz'] || 'Error loading quiz.'}</p>`;
    }
}

// Function to collect metadata
async function collectMetadata() {
    const metadata = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        latitude: null,
        longitude: null,
        accuracy: null,
        locationStatus: 'denied_or_unavailable' // Default status
    };

    if ("geolocation" in navigator) {
        await new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    metadata.latitude = position.coords.latitude;
                    metadata.longitude = position.coords.longitude;
                    metadata.accuracy = position.coords.accuracy;
                    metadata.locationStatus = 'granted';
                    resolve();
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    if (error.code === error.PERMISSION_DENIED) {
                        metadata.locationStatus = 'denied';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        metadata.locationStatus = 'unavailable';
                    } else if (error.code === error.TIMEOUT) {
                        metadata.locationStatus = 'timeout';
                    }
                    resolve();
                },
                {
                    enableHighAccuracy: false, // For privacy, usually better to keep this false unless critical
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    } else {
        console.warn('Geolocation not supported by this browser.');
        metadata.locationStatus = 'not_supported';
    }

    return metadata;
}

// Function to handle quiz submission
async function handleSubmitQuiz(responseSheetId) {
    const quizAnswers = {};
    document.querySelectorAll('#quiz-questions .question-block').forEach((questionBlock, index) => {
        const questionId = questionBlock.getAttribute('data-question-id');
        const inputElement = questionBlock.querySelector(`[name="question-${index}"]`);
        // Ensure inputElement exists before proceeding
        if (!inputElement) {
            console.warn(`Input element for question-${index} not found. Skipping.`);
            return;
        }
        const questionType = inputElement.type;

        if (questionType === 'radio') {
            const selected = questionBlock.querySelector(`input[name="question-${index}"]:checked`);
            quizAnswers[questionId] = selected ? selected.value : '';
        } else if (questionType === 'checkbox') {
            const selected = Array.from(questionBlock.querySelectorAll(`input[name="question-${index}"]:checked`)).map(cb => cb.value);
            quizAnswers[questionId] = selected.join(';'); // Use a separator for multiple selections
        } else if (questionType === 'textarea') {
            quizAnswers[questionId] = questionBlock.querySelector(`textarea[name="question-${index}"]`).value;
        } else if (questionType === 'text') {
            quizAnswers[questionId] = questionBlock.querySelector(`input[name="question-${index}"]`).value;
        }
    });

    const metadata = await collectMetadata();

    const payload = {
        masterSheetId: masterSheetId,
        quizGid: document.getElementById('quiz-display').getAttribute('data-gid'), // Need to store GID on quiz-display or pass
        responseSheetId: responseSheetId,
        answers: quizAnswers,
        metadata: metadata
    };

    console.log('Submitting Payload:', payload);

    try {
        const response = await fetch(gasWebAppLink, {
            method: 'POST',
            mode: 'cors', // Crucial for GAS Web Apps
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // GAS doPost expects text/plain or url-encoded for JSON parsing
            },
            body: JSON.stringify(payload), // Stringify the JSON payload
        });

        const result = await response.json();
        console.log('Submission Result:', result);

        if (result.status === 'success') {
            alert(contentData['quiz_submit_success'] || 'Quiz submitted successfully!');
            // Optionally, reset quiz or show results
            window.location.reload(); // Simple refresh for now
        } else {
            alert(`${contentData['quiz_submit_error'] || 'Error submitting quiz:'} ${result.message || 'Unknown error.'}`);
        }
    } catch (error) {
        console.error('Error during quiz submission:', error);
        alert(`${contentData['quiz_submit_network_error'] || 'Network error during quiz submission.'} ${error.message}`);
    }
}


// Function to render the individual quiz questions
function renderQuiz(quizData, responseSheetId) {
    const quizQuestionsDiv = document.getElementById('quiz-questions');
    quizQuestionsDiv.innerHTML = ''; // Clear previous questions

    const quizTitleH2 = document.getElementById('quiz-title');
    const quizDescriptionP = document.getElementById('quiz-description');
    const submitQuizButton = document.getElementById('submit-quiz');

    // Assuming first row of quizData might contain quiz title/description if not from master sheet
    // Or, these would have been passed from the master sheet data when calling onQuizSelected
    // For now, let's just clear them or set placeholders
    quizTitleH2.textContent = 'Quiz Title'; // Placeholder, ideally from master sheet
    quizDescriptionP.textContent = 'Quiz Description'; // Placeholder, ideally from master sheet

    quizData.forEach((question, index) => {
        const questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');
        questionBlock.setAttribute('data-question-id', question['Question ID']);
        questionBlock.setAttribute('data-question-id', question['Question ID']);

        const questionText = document.createElement('p');
        questionText.textContent = `${index + 1}. ${question['Question Text']}`;
        questionBlock.appendChild(questionText);

        if (question['Question Description']) {
            const questionDesc = document.createElement('p');
            questionDesc.classList.add('question-description');
            questionDesc.textContent = question['Question Description'];
            questionBlock.appendChild(questionDesc);
        }

        switch (question['Question Type']) {
            case 'single':
                ['Option 1', 'Option 2', 'Option 3', 'Option 4'].forEach(optionCol => {
                    if (question[optionCol]) {
                        const label = document.createElement('label');
                        const input = document.createElement('input');
                        input.type = 'radio';
                        input.name = `question-${index}`;
                        input.value = question[optionCol];
                        label.appendChild(input);
                        label.appendChild(document.createTextNode(question[optionCol]));
                        questionBlock.appendChild(label);
                    }
                });
                break;
            case 'multi':
                ['Option 1', 'Option 2', 'Option 3', 'Option 4'].forEach(optionCol => {
                    if (question[optionCol]) {
                        const label = document.createElement('label');
                        const input = document.createElement('input');
                        input.type = 'checkbox';
                        input.name = `question-${index}`;
                        input.value = question[optionCol];
                        label.appendChild(input);
                        label.appendChild(document.createTextNode(question[optionCol]));
                        questionBlock.appendChild(label);
                    }
                });
                break;
            case 'free-text':
                const textarea = document.createElement('textarea');
                textarea.name = `question-${index}`;
                textarea.rows = 4;
                textarea.placeholder = contentData['free_text_placeholder'] || 'Your answer here...';
                questionBlock.appendChild(textarea);
                break;
        }

        if (question.Hint) {
            const hint = document.createElement('p');
            hint.classList.add('question-hint');
            hint.textContent = `${contentData['hint_label'] || 'Hint'}: ${question.Hint}`;
            questionBlock.appendChild(hint);
        }

        quizQuestionsDiv.appendChild(questionBlock);
    });

    submitQuizButton.style.display = 'block';
    submitQuizButton.onclick = () => handleSubmitQuiz(responseSheetId); // Calling the implemented function
}

// Main initialization function
async function init() {
    await fetchContentSheet(); // First fetch and apply content

    const queryParams = getQueryParams();
    masterSheetId = queryParams.sheetId;

    if (masterSheetId) {
        console.log('Master Sheet ID:', masterSheetId);
        fetchMasterSheet(masterSheetId); // Calling the implemented function
    } else {
        console.error('No sheetId parameter found in URL.');
        // Display error message using contentData
        const quizSelection = document.getElementById('quiz-selection');
        quizSelection.innerHTML = `<p>${contentData['error_no_sheet_id'] || 'No quiz sheet ID provided in the URL.'}</p>`;
        document.getElementById('quiz-display').style.display = 'none';
    }
}

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);