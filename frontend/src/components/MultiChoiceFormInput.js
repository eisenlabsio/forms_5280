import React from 'react';

function MultiChoiceFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    const { options } = question;

    const handleInputChange = (e) => {
        const currentValues = currentAnswer ? currentAnswer.split(';') : [];
        let newValues;
        if (e.target.checked) {
            newValues = [...currentValues, e.target.value];
        } else {
            newValues = currentValues.filter(v => v !== e.target.value);
        }
        onAnswerChange(question.id, newValues.join(';'));
    };

    return (
        <>
            {options && options.map((option, idx) => (
                <label key={idx}>
                    <input
                        type="checkbox"
                        name={inputName}
                        value={option}
                        checked={(currentAnswer || '').split(';').includes(option)}
                        onChange={handleInputChange}
                    />
                    {option}
                </label>
            ))}
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default MultiChoiceFormInput;
