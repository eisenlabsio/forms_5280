import React from 'react';

function TimeQuestion({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    return (
        <>
            <input
                type="time"
                name={inputName}
                value={currentAnswer || ''}
                onChange={(e) => onAnswerChange(question.element_id, e.target.value)}
                required={isRequired}
            />
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default TimeQuestion;
