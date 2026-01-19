import React, { useState, useEffect } from 'react';
import QuestionTypeMap from './QuestionTypeMap'; // Import the new map

function QuestionElement({ question, onAnswerChange, currentAnswer, questionNumber }) {
    const { element_id, questionType, questionText, isRequired, validationRegex, errorMessage } = question;
    const inputName = `question-${element_id}`;
    const [localError, setLocalError] = useState('');

    // Centralized validation logic
    const validateInput = (value) => {
        if (isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
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
            }
        }
        setLocalError('');
        return true;
    };

    // Effect to re-validate when currentAnswer or validation rules change
    useEffect(() => {
        validateInput(currentAnswer);
    }, [currentAnswer, isRequired, validationRegex, errorMessage]);


    const SpecificQuestionComponent = QuestionTypeMap[questionType];

    if (!SpecificQuestionComponent) {
        console.warn(`Unknown question type: ${questionType}`);
        return <p>Error: Unknown question type.</p>;
    }

    return (
        <div className="question-block" data-element-id={element_id} data-question-type={questionType}>
            <p className="question-text">{questionNumber}. {questionText}</p>
            {question.questionHint && <p className="question-hint">{question.questionHint}</p>}
            <div className="input-area">
                <SpecificQuestionComponent
                    question={question}
                    onAnswerChange={(id, value) => {
                        onAnswerChange(id, value);
                        validateInput(value); // Validate after answer change
                    }}
                    currentAnswer={currentAnswer}
                    inputName={inputName}
                    isRequired={isRequired}
                    localError={localError}
                />
            </div>
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </div>
    );
}

export default QuestionElement;
