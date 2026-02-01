import React from 'react';
import { useQuiz } from '../context/QuizContext';

function LongTextFormInput({ question, onAnswerChange, currentAnswer, inputName, isRequired, localError }) {
    const { contentData } = useQuiz();
    const t = (key, fallback) => contentData[key] || fallback;
    return (
        <>
            <textarea
                name={inputName}
                rows="4"
                value={currentAnswer || ''}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder || t('long_text_placeholder', 'הכנס תשובה כאן...')}
                required={isRequired}
            ></textarea>
            {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>}
        </>
    );
}

export default LongTextFormInput;
