import React, { useState, useEffect } from 'react';
import { fetchQuiz } from '../services/googleSheets';
import { submitQuiz } from '../services/gasWebApp';
import QuizElementMap from './QuizElementMap';
import Page from './Page';
import logger from '../utils/logger'; // Import the logger

function QuizDisplay({ individualQuizSheetId, onBack }) {
    const [quizData, setQuizData] = useState(null); // This now holds the array of pages
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [currentQuizTitle, setCurrentQuizTitle] = useState('');
    const [currentQuizDescription, setCurrentQuizDescription] = useState('');
    const [currentResponseSheetId, setCurrentResponseSheetId] = useState('');

    useEffect(() => {
        const loadQuiz = async () => {
            logger.log('Loading quiz for individualQuizSheetId:', individualQuizSheetId);
            try {
                setLoading(true);
                const { quizData: fetchedPages, quizTitle: fetchedQuizTitle, quizDescription: fetchedQuizDescription, responseSheetId: fetchedResponseSheetId } = await fetchQuiz(individualQuizSheetId);
                
                setQuizData(fetchedPages);
                setCurrentQuizTitle(fetchedQuizTitle);
                setCurrentQuizDescription(fetchedQuizDescription);
                setCurrentResponseSheetId(fetchedResponseSheetId);
                logger.log('Quiz loaded:', { fetchedQuizTitle, fetchedQuizDescription, fetchedResponseSheetId, fetchedPages });

            } catch (err) {
                logger.error('Error loading quiz:', err);
                setError('Error loading quiz. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [individualQuizSheetId]);

    const handleAnswerChange = (questionId, answer) => {
        logger.log(`Answer changed for ${questionId}:`, answer);
        setUserAnswers(prevAnswers => ({
            ...prevAnswers,
            [questionId]: answer
        }));
    };

    const validatePage = () => {
        logger.log('Validating current page:', currentPageIndex);
        if (!quizData || quizData.length === 0) return true; // No quiz data, nothing to validate

        const currentPageElements = quizData[currentPageIndex].elements;
        let isValid = true;
        // newErrors is no longer used, removed it.
        // const newErrors = {}; // To store validation errors

        for (const item of currentPageElements) {
            if (item.type === 'question') { // Only validate actual questions
                const questionId = item.element_id;
                const answer = userAnswers[questionId];
                const isRequired = item.isRequired;
                const validationRegex = item.validationRegex;

                if (isRequired && (!answer || answer.length === 0)) {
                    isValid = false;
                    logger.warn(`Validation failed for ${questionId}: field is required.`);
                    // newErrors[questionId] = item.errorMessage || 'This field is required.';
                } else if (validationRegex && answer) {
                    try {
                        const regex = new RegExp(validationRegex);
                        if (!regex.test(answer)) {
                            isValid = false;
                            logger.warn(`Validation failed for ${questionId}: invalid format. Answer: ${answer}, Regex: ${validationRegex}`);
                            // newErrors[questionId] = item.errorMessage || 'Invalid input format.';
                        }
                    } catch (e) {
                        logger.error('Invalid regex:', validationRegex, e);
                    }
                }
            }
        }
        
        // This part needs to be handled by individual QuestionElement components for visual feedback
        // For now, we'll just return overall validity.
        if (!isValid) {
            alert('Please fill out all required fields and correct any invalid inputs on this page.');
            logger.warn('Page validation failed. User alerted.');
        } else {
            logger.log('Page validation successful.');
        }
        return isValid;
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
            const result = await submitQuiz(individualQuizSheetId, currentResponseSheetId, userAnswers);
            if (result.success) {
                alert('Quiz submitted successfully!');
                logger.log('Quiz submitted successfully.', result);
                onBack(); // Go back to quiz selection
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

    if (!quizData || quizData.length === 0) {
        logger.warn('QuizDisplay: No quiz data available.');
        return <div className="no-quiz-data">No quiz data available.</div>;
    }

    const currentPage = quizData[currentPageIndex];
    const isLastPage = currentPageIndex === quizData.length - 1;

    logger.log('QuizDisplay: Rendering page:', currentPage.page_id, 'Index:', currentPageIndex);

    return (
        <div id="quiz-display" className="quiz-display">
            <button onClick={onBack} className="back-button">← Back to Quiz Selection</button>
            <h2 id="quiz-title">{currentQuizTitle}</h2>
            <p id="quiz-description">{currentQuizDescription}</p>

            <Page
                page={currentPage}
                onAnswerChange={handleAnswerChange}
                userAnswers={userAnswers}
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

export default QuizDisplay;
