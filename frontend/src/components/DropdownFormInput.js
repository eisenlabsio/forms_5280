import React from 'react';
import { useQuiz } from '../context/QuizContext';

function DropdownFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    const { contentData } = useQuiz();
    const t = (key, fallback) => contentData[key] || fallback;
    const { options } = question;
    const placeholder = question.placeholder ?? t('dropdown_placeholder', 'בחר...');

    const handleInputChange = (e) => {
        onAnswerChange(question.id, e.target.value);
    };

    return (
        <>
            <select
                name={inputName}
                value={currentAnswer || ''}
                onChange={handleInputChange}
                required={isRequired}
            >
                <option value="">{placeholder}</option>
                {options && options.map((option, idx) => (
                    <option key={idx} value={option}>{option}</option>
                ))}
            </select>
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default DropdownFormInput;
