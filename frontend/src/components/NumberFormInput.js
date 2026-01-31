import React from 'react';

function NumberFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    return (
        <>
            <input
                type="number"
                name={inputName}
                value={currentAnswer || ''}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                required={isRequired}
            />
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default NumberFormInput;
