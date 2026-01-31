import React from 'react';

function PhoneFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    // Basic regex for a common phone number format (e.g., XXX-XXX-XXXX or XXXXXXXXXX)
    // This can be made more sophisticated or configurable.
    const phoneRegex = question.validationRegex || '^\\+?[1-9]\\d{1,14}$'; // Use validationRegex from question or default to E.164

    const handleInputChange = (e) => {
        const value = e.target.value;
        onAnswerChange(question.id, value);
    };

    return (
        <>
            <input
                type="tel" // 'tel' type provides native phone number input features on some devices
                name={inputName}
                value={currentAnswer || ''}
                onChange={handleInputChange}
                required={isRequired}
                pattern={phoneRegex} // Use regex.source to get the string pattern
                placeholder={question.placeholder || ''}
                title="Phone number must be in the format: 123-456-7890 or 1234567890" // This title might be overwritten by the global validation error message
            />
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default PhoneFormInput;
