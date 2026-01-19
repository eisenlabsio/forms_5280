import React, { useState, useEffect } from 'react';

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
                {questionType === 'multi_choice' && options && options.map((option, idx) => {
                    const checked = (currentAnswer || '').split(';').includes(option);
                    return (
                        <label key={idx}>
                            <input
                                type="checkbox"
                                name={inputName}
                                value={option}
                                checked={checked}
                                onChange={handleInputChange}
                            />
                            {option}
                        </label>
                    );
                })}
            </div>
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </div>
    );
}

export default QuestionElement;
