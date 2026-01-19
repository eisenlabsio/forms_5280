import React from 'react';

function SignatureQuestion({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    return (
        <>
            <input
                type="text" // Placeholder for now, actual signature capture would be more complex
                name={inputName}
                value={currentAnswer || ''}
                onChange={(e) => onAnswerChange(question.element_id, e.target.value)}
                placeholder="Type your name to sign (signature pad not implemented)"
                required={isRequired}
            />
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default SignatureQuestion;
