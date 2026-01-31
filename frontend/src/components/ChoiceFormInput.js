import React from 'react';

function ChoiceFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    const { options } = question;

    const handleInputChange = (e) => {
        onAnswerChange(question.id, e.target.value);
    };

    return (
        <>
            {options && options.map((option, idx) => (
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
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default ChoiceFormInput;
