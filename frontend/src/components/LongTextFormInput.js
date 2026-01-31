import React from 'react';

function LongTextFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    return (
        <>
            <textarea
                name={inputName}
                rows="4"
                value={currentAnswer || ''}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                placeholder="Your answer here..."
                required={isRequired}
            ></textarea>
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default LongTextFormInput;
