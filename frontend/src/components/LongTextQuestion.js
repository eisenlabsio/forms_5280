import React from 'react';

function LongTextQuestion({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    return (
        <>
            <textarea
                name={inputName}
                rows="4"
                value={currentAnswer || ''}
                onChange={(e) => onAnswerChange(question.element_id, e.target.value)}
                placeholder="Your answer here..."
                required={isRequired}
            ></textarea>
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default LongTextQuestion;
