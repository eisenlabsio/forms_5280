import React, { useState, useEffect } from 'react';
import { fetchQuiz } from '../services/googleSheets';
import { submitQuiz } from '../services/gasWebApp';
import QuizElementMap from './QuizElementMap';
import Page from './Page';

function QuizDisplay({ individualQuizSheetId, onBack }) {
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [currentQuizTitle, setCurrentQuizTitle] = useState('');
    const [currentQuizDescription, setCurrentQuizDescription] = useState('');
    const [currentResponseSheetId, setCurrentResponseSheetId] = useState('');

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                setLoading(true);
                const { quizData: fetchedPages, quizTitle: fetchedQuizTitle, quizDescription: fetchedQuizDescription, responseSheetId: fetchedResponseSheetId } = await fetchQuiz(individualQuizSheetId);
                
                setQuizData(fetchedPages);
                setCurrentQuizTitle(fetchedQuizTitle);
                setCurrentQuizDescription(fetchedQuizDescription);
                setCurrentResponseSheetId(fetchedResponseSheetId);

            } catch (err) {
                console.error('Error loading quiz:', err);
                setError('Error loading quiz. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [individualQuizSheetId]);

    const handleAnswerChange = (questionId, answer) => {
        setUserAnswers(prevAnswers => ({
            ...prevAnswers,
            [questionId]: answer
        }));
    };

    const validatePage = () => {
        if (!quizData || quizData.length === 0) return true; // No quiz data, nothing to validate

        const currentPageElements = quizData[currentPageIndex].elements;
        let isValid = true;
        const newErrors = {}; // To store validation errors

        currentPageElements.forEach(item => {
            if (item.questionType) { // It's a question
                const questionId = item.element_id;
                const answer = userAnswers[questionId];
                const isRequired = item.isRequired;
                const validationRegex = item.validationRegex;

                if (isRequired && !answer) {
                    isValid = false;
                    newErrors[questionId] = item.errorMessage || 'This field is required.';
                } else if (validationRegex && answer) {
                    try {
                        const regex = new RegExp(validationRegex);
                        if (!regex.test(answer)) {
                            isValid = false;
                            newErrors[questionId] = item.errorMessage || 'Invalid input format.';
                        }
                    } catch (e) {
                        console.error('Invalid regex:', validationRegex, e);
                    }
                }
            }
        });
        
        // This part needs to be handled by individual QuestionElement components for visual feedback
        // For now, we'll just return overall validity.
        if (!isValid) {
            alert('Please fill out all required fields and correct any invalid inputs on this page.');
        }
        return isValid;
    };

    const handleNextPage = () => {
        if (validatePage()) {
            setCurrentPageIndex(prevIndex => prevIndex + 1);
        }
    };

    const handlePrevPage = () => {
        setCurrentPageIndex(prevIndex => prevIndex - 1);
    };

    const handleSubmit = async () => {
        if (!validatePage()) {
            return;
        }

        try {
            const result = await submitQuiz(individualQuizSheetId, currentResponseSheetId, userAnswers);
            if (result.success) {
                alert('Quiz submitted successfully!');
                onBack(); // Go back to quiz selection
            } else {
                alert(`Error submitting quiz: ${result.message}`);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return <div className="loading-message">Loading quiz...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!quizData || quizData.length === 0) {
        return <div className="no-quiz-data">No quiz data available.</div>;
    }

    const currentPage = quizData[currentPageIndex];
    const isLastPage = currentPageIndex === quizData.length - 1;



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
