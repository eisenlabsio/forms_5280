import React from 'react';

function DateFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    return (
        <>
            <input
                type="date"
                name={inputName}
                value={currentAnswer || ''}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                required={isRequired}
            />
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default DateFormInput;
