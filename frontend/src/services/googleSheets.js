import Papa from 'papaparse';
import logger from '../utils/logger';
import { parseQuizSheet } from './quizParser';
import { parsePathValueSheet } from './sheetParser';

const GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d/';

// Helper function to parse CSV text into an array of objects using PapaParse
async function parseCSV(csvText) {
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const filteredData = results.data.filter(row => {
                    return Object.values(row).some(value => value !== null && value !== '' && value !== undefined);
                });
                logger.log('CSV parsed and filtered successfully.', filteredData);
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
        const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}${contentSheetId}/export?format=csv`);
        if (!response.ok) {
            logger.error(`HTTP error! status: ${response.status} when fetching content sheet ID: ${contentSheetId}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const parsedData = await parseCSV(csvText);
        logger.log('Content sheet fetched and parsed successfully.', parsedData);

        const contentData = {};
        parsedData.forEach(item => {
            if (item.Key && item.Hebrew) {
                contentData[item.Key] = item.Hebrew;
            }
        });
        return contentData;
    } catch (error) {
        logger.error('Error fetching content sheet:', error);
        return {};
    }
}

// Function to fetch master sheet data using the new path-value format
async function fetchMasterSheet(sheetId) {
    logger.log('Attempting to fetch master sheet with ID:', sheetId);
    if (!sheetId) {
        logger.error('Master Sheet ID is not provided.');
        return { masterQuizTitle: 'Quiz Selection', masterQuizDescription: 'Select a quiz from the list below.', availableQuizzes: [] };
    }
    try {
        const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}${sheetId}/export?format=csv`);
        if (!response.ok) {
            logger.error(`HTTP error! status: ${response.status} when fetching master sheet ID: ${sheetId}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const masterSheetData = await parseCSV(csvText);
        const parsedData = parsePathValueSheet(masterSheetData);
        
        const masterQuizTitle = parsedData.global?.quiz_title || 'Quiz Selection';
        const masterQuizDescription = parsedData.global?.quiz_description || 'Select a quiz from the list below.';
        const masterDirection = parsedData.global?.master_direction || parsedData.global?.quiz_direction || 'ltr';
        const availableQuizzes = Object.values(parsedData.quizzes || {}); // Fix: Convert object to array
        
        logger.log('Parsed master quiz data:', { masterQuizTitle, masterQuizDescription, masterDirection, availableQuizzes });
        return { masterQuizTitle, masterQuizDescription, masterDirection, availableQuizzes };
    } catch (error) {
        logger.error('Error fetching master sheet:', error);
        return { masterQuizTitle: 'Quiz Selection', masterQuizDescription: 'Select a quiz from the list below.', masterDirection: 'ltr', availableQuizzes: [] };
    }
}

// Function to fetch individual quiz data using the new path-value format
async function fetchQuiz(individualQuizSheetId) {
    logger.log('Attempting to fetch individual quiz sheet with ID:', individualQuizSheetId);
    if (!individualQuizSheetId) {
        logger.error('Individual Quiz Sheet ID is not provided.');
        return null;
    }
    try {
        const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}${individualQuizSheetId}/export?format=csv`);
        if (!response.ok) {
            logger.error(`HTTP error! status: ${response.status} when fetching quiz sheet ID: ${individualQuizSheetId}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const quizData = await parseCSV(csvText);
        logger.log('fetchQuiz: quizData before parseQuizSheet:', quizData); // Debugging
        const quiz = parseQuizSheet(quizData);
        
        logger.log('Parsed individual quiz data:', quiz);
        return quiz;
    } catch (error) {
        logger.error('Error fetching quiz:', error);
        return null;
    }
}

export { parseCSV, fetchContentSheet, fetchMasterSheet, fetchQuiz };
