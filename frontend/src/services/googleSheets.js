import Papa from 'papaparse';
import logger from '../utils/logger';

const GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d/';

// Helper function to parse CSV text into an array of objects using PapaParse
async function parseCSV(csvText) {
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Filter out rows where all values are effectively empty
                const filteredData = results.data.filter(row => {
                    return Object.values(row).some(value => value !== null && value !== '' && value !== undefined);
                });
                logger.log('CSV parsed and filtered successfully.', filteredData); // Log filtered data
                resolve(filteredData);
            },
            error: (error) => {
                logger.error('CSV parsing error:', error);
                reject(error);
            }
        });
    });
}

// Function to fetch content from the Content Google Sheet
async function fetchContentSheet(contentSheetId) {
    logger.log('Attempting to fetch content sheet with ID:', contentSheetId);
    if (!contentSheetId || contentSheetId === 'YOUR_CONTENT_SHEET_ID_HERE') {
        logger.error('Content Sheet ID is not set.');
        return {};
    }
    try {
        const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}${contentSheetId}/export?format=csv`); // Assuming content is on gid=0
        if (!response.ok) {
            logger.error(`HTTP error! status: ${response.status} when fetching content sheet ID: ${contentSheetId}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const parsedData = await parseCSV(csvText);
        logger.log('Content sheet fetched and parsed successfully.', parsedData);

        const contentData = {};
        parsedData.forEach(item => {
            if (item.Key && item.Hebrew) { // Assuming 'Key' and 'Hebrew' columns exist
                contentData[item.Key] = item.Hebrew;
            }
        });
        return contentData;
    } catch (error) {
        logger.error('Error fetching content sheet:', error);
        return {};
    }
}

// Function to fetch master sheet data
async function fetchMasterSheet(sheetId) {
    logger.log('Attempting to fetch master sheet with ID:', sheetId);
    if (!sheetId) {
        logger.error('Master Sheet ID is not provided.');
        return { masterQuizTitle: 'Quiz Selection', masterQuizDescription: 'Select a quiz from the list below.', individualQuizSheetIds: [] };
    }
    try {
        const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}${sheetId}/export?format=csv`);
        if (!response.ok) {
            logger.error(`HTTP error! status: ${response.status} when fetching master sheet ID: ${sheetId}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const masterSheetData = await parseCSV(csvText);
        logger.log('Master sheet fetched and parsed successfully.', masterSheetData);

        let masterQuizTitle = 'Quiz Selection'; // Default title
        let masterQuizDescription = 'Select a quiz from the list below.'; // Default description
        const individualQuizSheetIds = [];

        masterSheetData.forEach(row => {
            // New parsing logic for type,value structure
            if (row.type === 'title') {
                masterQuizTitle = row.value;
            } else if (row.type === 'description') {
                masterQuizDescription = row.value;
            } else if (row.type === 'quiz_sheet_id') {
                // Assuming the value directly corresponds to the sheet ID for individual quizzes
                individualQuizSheetIds.push({ gid: row.value, title: '', description: '', responseSheetId: '' }); // Populate other fields if needed from a different source or default
            }
        });
        logger.log('Parsed master quiz data:', { masterQuizTitle, masterQuizDescription, individualQuizSheetIds });
        return { masterQuizTitle, masterQuizDescription, individualQuizSheetIds };
    } catch (error) {
        logger.error('Error fetching master sheet:', error);
        return { masterQuizTitle: 'Quiz Selection', masterQuizDescription: 'Select a quiz from the list below.', individualQuizSheetIds: [] };
    }
}

// Function to fetch individual quiz data
async function fetchQuiz(individualQuizSheetId) {
    logger.log('Attempting to fetch individual quiz sheet with ID:', individualQuizSheetId);
    if (!individualQuizSheetId) {
        logger.error('Individual Quiz Sheet ID is not provided.');
        return { quizTitle: 'Error', quizDescription: 'No quiz ID provided.', quizData: [] };
    }
    try {
        const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}${individualQuizSheetId}/export?format=csv`); // Always fetch from GID 0 for structured quiz definition
        if (!response.ok) {
            logger.error(`HTTP error! status: ${response.status} when fetching quiz sheet ID: ${individualQuizSheetId}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const quizData = await parseCSV(csvText);
        logger.log('Individual quiz sheet fetched and parsed successfully.', quizData);
        
        let quizTitle = 'Untitled Quiz';
        let quizDescription = 'No description available.';
        let responseSheetId = '';

        const pages = [];
        let currentPage = null;
        let currentQuestionProps = {};

        quizData.forEach(row => {
            const { page, element_id, type, value } = row;

            if (row.element_id === 'quiz_title') {
                quizTitle = row.type;
            } else if (row.element_id === 'quiz_description') {
                quizDescription = row.type;
            } else if (row.element_id === 'response_sheet_id') {
                responseSheetId = row.type;
            } else if (element_id && element_id.endsWith('_page_def')) { // This identifies a row belonging to a page definition
                // If it's the *start* of a new page definition (i.e., type is 'page_id')
                // OR if currentPage is null (first page)
                // then finalize the previous page and start a new one.
                if (type === 'page_id' && currentPage) {
                    pages.push(currentPage);
                    currentPage = { page_id: '', page_title: '', page_description: '', elements: [] };
                } else if (!currentPage) { // Initialize first page
                    currentPage = { page_id: '', page_title: '', page_description: '', elements: [] };
                }

                // Now, assign the page properties based on the 'type'
                if (type === 'page_id') {
                    currentPage.page_id = value;
                } else if (type === 'page_title') {
                    currentPage.page_title = value;
                } else if (type === 'page_description') {
                    currentPage.page_description = value;
                }
            } else if (page && currentPage && currentPage.page_id === page) { // Element belongs to current page
                if (type === 'question' || type.startsWith('question_')) {
                    // Logic to accumulate question properties
                    if (type === 'question' && currentQuestionProps.element_id && currentQuestionProps.element_id !== element_id) {
                        currentPage.elements.push({ ...currentQuestionProps });
                        currentQuestionProps = {}; // Reset
                    }
                    if (element_id && !currentQuestionProps.element_id) {
                        currentQuestionProps.element_id = element_id;
                        currentQuestionProps.options = [];
                        currentQuestionProps.type = 'question'; // Explicitly set type for questions
                    }

                    if (currentQuestionProps.element_id === element_id) {
                        if (type === 'question') {
                            currentQuestionProps.questionText = value;
                        } else if (type === 'question_id') {
                            currentQuestionProps.questionId = value;
                        } else if (type === 'question_type') {
                            currentQuestionProps.questionType = value;
                        } else if (type === 'question_option') {
                            currentQuestionProps.options.push(value);
                        } else if (type === 'question_hint') {
                            currentQuestionProps.questionHint = value;
                        } else if (type === 'question_error_message') {
                            currentQuestionProps.errorMessage = value;
                        }
                        else if (type === 'question_right_answer') {
                            currentQuestionProps.rightAnswer = value;
                        } else if (type === 'question_validation_regex') {
                            currentQuestionProps.validationRegex = value;
                        } else if (type === 'question_is_required') {
                            currentQuestionProps.isRequired = (value.toLowerCase() === 'true');
                        }
                    }
                } else {
                    // Handle other page-level elements (like info_text)
                    if (currentQuestionProps.element_id) { // Push any pending question before a new element
                        currentPage.elements.push({ ...currentQuestionProps });
                        currentQuestionProps = {};
                    }
                    currentPage.elements.push({ type: type, value: value, element_id: element_id, page: page });
                }
            }
        });

        // Push the last accumulated question if any
        if (currentQuestionProps.element_id) {
            if (currentPage) {
                currentPage.elements.push({ ...currentQuestionProps });
            }
        }
        // Push the last page if exists
        if (currentPage) {
            pages.push(currentPage);
        }
        logger.log('Parsed individual quiz data:', { quizTitle, quizDescription, responseSheetId, quizData: pages });
        return { quizTitle, quizDescription, responseSheetId, quizData: pages }; // quizData is now pages
    } catch (error) {
        logger.error('Error fetching quiz:', error);
        return { quizTitle: 'Error', quizDescription: 'Failed to load quiz.', responseSheetId: '', quizData: [] };
    }
}

export { parseCSV, fetchContentSheet, fetchMasterSheet, fetchQuiz };
