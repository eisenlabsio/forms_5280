import React from 'react';

function TimeFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    return (
        <>
            <input
                type="time"
                name={inputName}
                value={currentAnswer || ''}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder || ''}
                required={isRequired}
            />
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default TimeFormInput;
