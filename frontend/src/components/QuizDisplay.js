import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchQuiz } from '../services/googleSheets';
import { submitQuiz } from '../services/gasWebApp';
import Page from './Page';
import logger from '../utils/logger';
import { normalizeRegexString } from '../utils/validation';

function QuizDisplay({ individualQuizSheetId, onBack }) {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [validationErrors, setValidationErrors] = useState({}); // New state for validation errors
    const rememberKeyMapRef = useRef({});

    useEffect(() => {
        const loadQuiz = async () => {
            logger.log('Loading quiz for individualQuizSheetId:', individualQuizSheetId);
            try {
                setLoading(true);
                const fetchedQuiz = await fetchQuiz(individualQuizSheetId);
                
                if (fetchedQuiz) {
                    setQuiz(fetchedQuiz);
                    logger.log('Quiz loaded:', fetchedQuiz);
                } else {
                    throw new Error("Quiz data could not be fetched.");
                }

            } catch (err) {
                logger.error('Error loading quiz:', err);
                setError('Error loading quiz. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [individualQuizSheetId]);

    useEffect(() => {
        if (!quiz) {
            rememberKeyMapRef.current = {};
            return;
        }

        const rememberKeyMap = {};
        const rememberedAnswers = {};
        const defaultAnswers = {};

        quiz.getPages().forEach(page => {
            page.getElements().forEach(item => {
                if (item.category === 'question' && item.rememberLastAnswer) {
                    const storageKey = buildRememberStorageKey(item.rememberKey, individualQuizSheetId, item.id);
                    rememberKeyMap[item.id] = storageKey;
                    const savedValue = getRememberedValue(storageKey);
                    if (savedValue !== null && savedValue !== undefined && savedValue !== '') {
                        rememberedAnswers[item.id] = savedValue;
                    } else if (item.defaultAnswer !== undefined && item.defaultAnswer !== null && item.defaultAnswer !== '') {
                        defaultAnswers[item.id] = item.defaultAnswer;
                    }
                } else if (item.category === 'question' && item.defaultAnswer !== undefined && item.defaultAnswer !== null && item.defaultAnswer !== '') {
                    defaultAnswers[item.id] = item.defaultAnswer;
                }
            });
        });

        rememberKeyMapRef.current = rememberKeyMap;
        if (Object.keys(rememberedAnswers).length > 0 || Object.keys(defaultAnswers).length > 0) {
            setUserAnswers(prevAnswers => ({
                ...rememberedAnswers,
                ...defaultAnswers,
                ...prevAnswers,
            }));
        }
    }, [quiz, individualQuizSheetId]);

    const runValidation = useCallback((formInput, value) => {
        let errorMessage = '';

        if (formInput.isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
            errorMessage = formInput.errorMessage || 'This field is required.';
        } else if (formInput.validationRegex && value) {
            const normalizedRegex = normalizeRegexString(formInput.validationRegex);
            try {
                const regex = new RegExp(normalizedRegex);
                if (!regex.test(value)) {
                    errorMessage = formInput.errorMessage || 'Invalid input format.';
                }
            } catch (e) {
                logger.error('Error during regex validation:', formInput.validationRegex, e);
                errorMessage = 'Invalid validation rule.';
            }
        }
        return errorMessage;
    }, []);

    const handleAnswerChange = (formInputId, answer) => {
        const stringAnswer = String(answer);
        logger.log(`Answer changed for ${formInputId}:`, stringAnswer);
        const storageKey = rememberKeyMapRef.current[formInputId];
        if (storageKey) {
            saveRememberedValue(storageKey, stringAnswer);
        }
        setUserAnswers(prevAnswers => ({
            ...prevAnswers,
            [formInputId]: stringAnswer
        }));

        // Validate immediately after change
        if (quiz) {
            const currentPages = quiz.getPages();
            const currentPage = currentPages[currentPageIndex];
            const formInput = currentPage.getElements().find(el => el.id === formInputId);
            if (formInput && formInput.category === 'question') {
                const errorMessage = runValidation(formInput, stringAnswer);
                setValidationErrors(prevErrors => ({
                    ...prevErrors,
                    [formInputId]: errorMessage
                }));
            }
        }
    };

    const validatePage = () => {
        if (!quiz) return true;

        const currentPages = quiz.getPages();
        const currentPage = currentPages[currentPageIndex];
        let pageIsValid = true;
        const newValidationErrors = {};

        currentPage.getElements().forEach(formInput => {
            if (formInput.category === 'question') {
                const value = userAnswers[formInput.id];
                const errorMessage = runValidation(formInput, value);
                if (errorMessage) {
                    newValidationErrors[formInput.id] = errorMessage;
                    pageIsValid = false;
                }
            }
        });

        setValidationErrors(newValidationErrors);
        return pageIsValid;
    };

    const handleNextPage = () => {
        logger.log('Attempting to navigate to next page.');
        if (validatePage()) {
            setCurrentPageIndex(prevIndex => prevIndex + 1);
            logger.log('Navigated to next page. Current page index:', currentPageIndex + 1);
        } else {
            logger.warn('Cannot navigate to next page: current page validation failed.');
        }
    };

    const handlePrevPage = () => {
        logger.log('Navigating to previous page. Current page index:', currentPageIndex - 1);
        setCurrentPageIndex(prevIndex => prevIndex - 1);
    };

    const handleSubmit = async () => {
        logger.log('Attempting to submit quiz.');
        if (!validatePage()) {
            logger.warn('Quiz submission prevented: current page validation failed.');
            return;
        }

        try {
            logger.log('Submitting quiz with answers:', userAnswers);
            const result = await submitQuiz(individualQuizSheetId, quiz.responseSheetId, userAnswers);
            if (result.success) {
                alert('Quiz submitted successfully!');
                logger.log('Quiz submitted successfully.', result);
                onBack();
            } else {
                alert(`Error submitting quiz: ${result.message}`);
                logger.error('Error submitting quiz:', result.message);
            }
        } catch (err) {
            logger.error('Error during quiz submission process:', err);
            alert(err.message);
        }
    };

    if (loading) {
        logger.log('QuizDisplay: Loading state active.');
        return <div className="loading-message">Loading quizzes...</div>;
    }

    if (error) {
        logger.error('QuizDisplay: Error state active.', error);
        return <div className="error-message">{error}</div>;
    }

    if (!quiz) {
        logger.warn('QuizDisplay: No quiz data available.');
        return <div className="no-quiz-data">No quiz data available.</div>;
    }

    const pages = quiz.getPages();
    const currentPage = pages[currentPageIndex];
    const isLastPage = currentPageIndex === pages.length - 1;

    logger.log('QuizDisplay: Rendering page:', currentPage.id, 'Index:', currentPageIndex);

    return (
        <div id="quiz-display" className="quiz-display" dir={quiz.direction || 'ltr'}>
            <button onClick={onBack} className="back-button">← Back to Quiz Selection</button>
            <h2 id="quiz-title">{quiz.title}</h2>
            <p id="quiz-description">{quiz.description}</p>

            <Page
                page={currentPage}
                onAnswerChange={handleAnswerChange}
                userAnswers={userAnswers}
                validationErrors={validationErrors} // Pass down validation errors
            />

            <div className="quiz-navigation">
                {currentPageIndex > 0 && (
                    <button onClick={handlePrevPage} className="prev-button">Previous</button>
                )}
                {!isLastPage && (
                    <button onClick={handleNextPage} className="next-button">Next</button>
                )}
                {isLastPage && (
                    <button onClick={handleSubmit} id="submit-quiz" className="submit-button">Submit Quiz</button>
                )}
            </div>
        </div>
    );
}

function buildRememberStorageKey(rememberKey, quizSheetId, formInputId) {
    if (rememberKey && String(rememberKey).trim()) {
        return `quiz:remember:${String(rememberKey).trim()}`;
    }
    return `quiz:remember:${quizSheetId || 'default'}:${formInputId}`;
}

function getRememberedValue(storageKey) {
    try {
        return window.localStorage.getItem(storageKey);
    } catch (error) {
        logger.warn('Failed to read remembered answer:', error.message);
        return null;
    }
}

function saveRememberedValue(storageKey, value) {
    try {
        window.localStorage.setItem(storageKey, value);
    } catch (error) {
        logger.warn('Failed to store remembered answer:', error.message);
    }
}

export default QuizDisplay;
