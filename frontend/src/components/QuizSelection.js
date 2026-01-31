import React, { useState, useEffect } from 'react';
import { fetchMasterSheet } from '../services/googleSheets';
import logger from '../utils/logger';

function QuizSelection({ onQuizSelect, onMasterConfig }) {
    const [masterQuizTitle, setMasterQuizTitle] = useState('Quiz Selection');
    const [masterQuizDescription, setMasterQuizDescription] = useState('Select a quiz from the list below.');
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [masterDirection, setMasterDirection] = useState('ltr');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const masterSheetId = queryParams.get('sheetId');
        logger.log('Master sheet ID from URL:', masterSheetId);

        if (!masterSheetId) {
            setError('No sheetId parameter found in URL. Please provide a master sheet ID.');
            logger.error('No sheetId parameter found in URL.');
            setLoading(false);
            return;
        }

        const loadMasterSheet = async () => {
            try {
                setLoading(true);
                const { masterQuizTitle, masterQuizDescription, masterDirection, availableQuizzes } = await fetchMasterSheet(masterSheetId);
                setMasterQuizTitle(masterQuizTitle);
                setMasterQuizDescription(masterQuizDescription);
                setMasterDirection(masterDirection === 'rtl' ? 'rtl' : 'ltr');
                setAvailableQuizzes(availableQuizzes);
                if (typeof onMasterConfig === 'function') {
                    onMasterConfig({ title: masterQuizTitle, direction: masterDirection });
                }
                logger.log('Available quizzes:', availableQuizzes);
            } catch (err) {
                logger.error('Error loading master sheet:', err);
                setError('Error loading quizzes. Please check the sheet ID and network connection.');
            } finally {
                setLoading(false);
            }
        };

        loadMasterSheet();
    }, []);

    if (loading) {
        return <div className="loading-message">Loading quizzes...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (availableQuizzes.length === 0) {
        return <div className="no-quizzes-message">No quizzes available.</div>;
    }

    return (
        <div id="quiz-selection" className="quiz-selection" dir={masterDirection}>
            <h2>{masterQuizTitle}</h2>
            <p className="master-quiz-description">{masterQuizDescription}</p>
            <div id="quiz-list" className="quiz-list">
                {availableQuizzes.map(quiz => (
                    <div
                        key={quiz.sheet_id}
                        className="quiz-card"
                        onClick={() => onQuizSelect(quiz.sheet_id, quiz.title, quiz.description)}
                    >
                        <h3>{quiz.title}</h3>
                        <p>{quiz.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default QuizSelection;
