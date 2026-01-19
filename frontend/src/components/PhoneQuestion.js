import React from 'react';

function PhoneQuestion({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    // Basic regex for a common phone number format (e.g., XXX-XXX-XXXX or XXXXXXXXXX)
    // This can be made more sophisticated or configurable.
    const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

    const handleInputChange = (e) => {
        const value = e.target.value;
        onAnswerChange(question.element_id, value);
    };

    return (
        <>
            <input
                type="tel" // 'tel' type provides native phone number input features on some devices
                name={inputName}
                value={currentAnswer || ''}
                onChange={handleInputChange}
                required={isRequired}
                pattern={phoneRegex.source} // Use regex.source to get the string pattern
                title="Phone number must be in the format: 123-456-7890 or 1234567890"
            />
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default PhoneQuestion;
