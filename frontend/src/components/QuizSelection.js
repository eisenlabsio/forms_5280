import React, { useState, useEffect } from 'react';
import { fetchMasterSheet } from '../services/googleSheets';
import logger from '../utils/logger';
import { useQuiz } from '../context/QuizContext';

function QuizSelection({ onQuizSelect, onMasterConfig }) {
    const { contentData } = useQuiz();
    const t = (key, fallback) => contentData[key] || fallback;
    const [masterQuizTitle, setMasterQuizTitle] = useState('בחירת טופס');
    const [masterQuizDescription, setMasterQuizDescription] = useState('בחר טופס מהרשימה שלמטה.');
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [masterDirection, setMasterDirection] = useState('ltr');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const sheetIdParam = queryParams.get('sheetId');
        const shortIdParam = queryParams.get('s');
        const masterSheetSuffix = process.env.REACT_APP_MASTER_SHEET_SUFFIX || '';
        let masterSheetId = sheetIdParam;
        if (!masterSheetId && shortIdParam) {
            if (!masterSheetSuffix) {
                setError(t('error_missing_sheet_suffix', 'נמסר מזהה קצר ללא סיומת מוגדרת.'));
                logger.error('Short sheet id provided but REACT_APP_MASTER_SHEET_SUFFIX is missing.');
                setLoading(false);
                return;
            }
            masterSheetId = `${shortIdParam}${masterSheetSuffix}`;
        }
        logger.log('Master sheet ID from URL:', masterSheetId);

        if (!masterSheetId) {
            setError(t('error_no_sheet_id', 'פרמטר s הוא חובה.'));
            logger.error('No sheetId or s parameter found in URL.');
            setLoading(false);
            return;
        }

        const loadMasterSheet = async () => {
            try {
                setLoading(true);
                const { masterQuizTitle, masterQuizDescription, masterDirection, masterFontScaleConfig, availableQuizzes } = await fetchMasterSheet(masterSheetId);
                setMasterQuizTitle(masterQuizTitle);
                setMasterQuizDescription(masterQuizDescription);
                setMasterDirection(masterDirection === 'rtl' ? 'rtl' : 'ltr');
                setAvailableQuizzes(availableQuizzes);
                if (typeof onMasterConfig === 'function') {
                    onMasterConfig({ title: masterQuizTitle, direction: masterDirection, fontScaleConfig: masterFontScaleConfig });
                }
                logger.log('Available quizzes:', availableQuizzes);
            } catch (err) {
                logger.error('Error loading master sheet:', err);
                setError(t('error_fetching_master_sheet', 'שגיאה בטעינת הטפסים. בדוק את מזהה הגיליון והחיבור לרשת.'));
            } finally {
                setLoading(false);
            }
        };

        loadMasterSheet();
    }, []);

    if (loading) {
        return <div className="loading-message">{t('loading_quizzes', 'טוען טפסים...')}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (availableQuizzes.length === 0) {
        return <div className="no-quizzes-message">{t('no_quizzes_available', 'אין טפסים זמינים.')}</div>;
    }

    return (
        <div id="quiz-selection" className="quiz-selection" dir={masterDirection}>
            <h2>{masterQuizTitle}</h2>
            <p className="master-quiz-description">{masterQuizDescription}</p>
            <div id="quiz-list" className="quiz-list">
                {availableQuizzes.map(quiz => {
                    const isCompleted = getCompletionStatus(quiz.sheet_id);
                    return (
                    <div
                        key={quiz.sheet_id}
                        className={`quiz-card${isCompleted ? ' completed' : ''}`}
                        onClick={() => onQuizSelect(quiz.sheet_id, quiz.title, quiz.description)}
                    >
                        {isCompleted && (
                            <span className="quiz-card-status">{t('quiz_completed_label', 'הושלם')}</span>
                        )}
                        <h3>{quiz.title}</h3>
                        <p>{quiz.description}</p>
                    </div>
                    );
                })}
            </div>
        </div>
    );
}

function getCompletionStatus(quizSheetId) {
    try {
        return window.localStorage.getItem(`quiz:completed:${quizSheetId || 'default'}`) === 'true';
    } catch (error) {
        return false;
    }
}

export default QuizSelection;
