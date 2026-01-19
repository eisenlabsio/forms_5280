import React, { useState, useEffect } from 'react';
import { fetchQuiz } from '../services/googleSheets';
import { submitQuiz } from '../services/gasWebApp';

function QuestionElement({ question, onAnswerChange, currentAnswer, questionNumber }) {
    const { element_id, questionType, questionText, options, isRequired, validationRegex, errorMessage } = question;
    const inputName = `question-${element_id}`;
    const [localError, setLocalError] = useState('');

    const handleInputChange = (e) => {
        let value;
        if (questionType === 'multi_choice') {
            const currentValues = currentAnswer ? currentAnswer.split(';') : [];
            if (e.target.checked) {
                value = [...currentValues, e.target.value].join(';');
            } else {
                value = currentValues.filter(v => v !== e.target.value).join(';');
            }
        } else {
            value = e.target.value;
        }
        onAnswerChange(element_id, value);
        // Clear error on change if input is valid
        validateInput(value);
    };

    const validateInput = (value) => {
        if (isRequired && !value) {
            setLocalError(errorMessage || 'This field is required.');
            return false;
        }
        if (validationRegex && value) {
            try {
                const regex = new RegExp(validationRegex);
                if (!regex.test(value)) {
                    setLocalError(errorMessage || 'Invalid input format.');
                    return false;
                }
            } catch (e) {
                console.error('Invalid regex:', validationRegex, e);
                // Fallback to no regex validation if regex is invalid
            }
        }
        setLocalError('');
        return true;
    };

    useEffect(() => {
        // Initial validation check if there's a current answer
        validateInput(currentAnswer);
    }, [currentAnswer, isRequired, validationRegex, errorMessage]); // Added dependencies to useEffect

    return (
        <div className="question-block" data-element-id={element_id} data-question-type={questionType}>
            <p className="question-text">{questionNumber}. {questionText}</p>
            {question.questionHint && <p className="question-hint">{question.questionHint}</p>}
            <div className="input-area">
                {questionType === 'text' && (
                    <input type="text" name={inputName} value={currentAnswer || ''} onChange={handleInputChange} required={isRequired} />
                )}
                {questionType === 'long_text' && (
                    <textarea name={inputName} rows="4" value={currentAnswer || ''} onChange={handleInputChange} placeholder="Your answer here..." required={isRequired}></textarea>
                )}
                {questionType === 'number' && (
                    <input type="number" name={inputName} value={currentAnswer || ''} onChange={handleInputChange} required={isRequired} />
                )}
                {questionType === 'date' && (
                    <input type="date" name={inputName} value={currentAnswer || ''} onChange={handleInputChange} required={isRequired} />
                )}
                {questionType === 'signature' && (
                    <input type="text" name={inputName} value={currentAnswer || ''} onChange={handleInputChange} placeholder="Draw signature here (not implemented)" required={isRequired} />
                )}
                {questionType === 'choice' && options && options.map((option, idx) => (
                    <label key={idx}>
                        <input
                            type="radio"
                            name={inputName}
                            value={option}
                            checked={currentAnswer === option}
                            onChange={handleInputChange}
                            required={isRequired}
                        />
                        {option}
                    </label>
                ))}
                {questionType === 'multi_choice' && options && options.map((option, idx) => (
                    <label key={idx}>
                        <input
                            type="checkbox"
                            name={inputName}
                            value={option}
                            checked={(currentAnswer || '').split(';').includes(option)}
                            onChange={handleInputChange}
                        />
                        {option}
                    </label>
                ))}
            </div>
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </div>
    );
}

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

    let questionNumberCounter = 0;

    return (
        <div id="quiz-display" className="quiz-display">
            <button onClick={onBack} className="back-button">← Back to Quiz Selection</button>
            <h2 id="quiz-title">{currentQuizTitle}</h2>
            <p id="quiz-description">{currentQuizDescription}</p>

            <h3>{currentPage.page_title}</h3>
            {currentPage.page_description && <p>{currentPage.page_description}</p>}

            <div id="quiz-questions">
                {currentPage.elements.map((item, index) => {
                    if (item.type === 'section_title') {
                        return <h4 key={index} className="section-title">{item.value}</h4>;
                    } else if (item.type === 'info_text') {
                        return <p key={index} className="info-text">{item.value}</p>;
                    } else if (item.type === 'question') { // Check for type 'question'
                        questionNumberCounter++;
                        return (
                            <QuestionElement
                                key={item.element_id}
                                question={item}
                                questionNumber={questionNumberCounter}
                                onAnswerChange={handleAnswerChange}
                                currentAnswer={userAnswers[item.element_id]}
                            />
                        );
                    }
                    return null;
                })}
            </div>

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
