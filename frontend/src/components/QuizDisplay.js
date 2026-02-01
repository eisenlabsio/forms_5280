import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchQuiz } from '../services/googleSheets';
import { submitQuiz } from '../services/gasWebApp';
import Page from './Page';
import logger from '../utils/logger';
import { normalizeRegexString } from '../utils/validation';
import { useQuiz } from '../context/QuizContext';

function QuizDisplay({ individualQuizSheetId, onBack, onQuizConfig, resetToken }) {
    const { contentData } = useQuiz();
    const t = (key, fallback) => contentData[key] || fallback;
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [validationErrors, setValidationErrors] = useState({}); // New state for validation errors
    const [testComplete, setTestComplete] = useState(false);
    const [testScore, setTestScore] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionComplete, setSubmissionComplete] = useState(false);
    const [popupState, setPopupState] = useState({ open: false, message: '', type: 'info', action: '' });
    const rememberKeyMapRef = useRef({});

    useEffect(() => {
        const loadQuiz = async () => {
            logger.log('Loading quiz for individualQuizSheetId:', individualQuizSheetId);
            try {
                setLoading(true);
                const fetchedQuiz = await fetchQuiz(individualQuizSheetId);
                
                if (fetchedQuiz) {
                    setQuiz(fetchedQuiz);
                    if (typeof onQuizConfig === 'function') {
                        onQuizConfig({
                            fontScaleConfig: fetchedQuiz.fontScaleConfig || null,
                            direction: fetchedQuiz.direction || 'ltr',
                        });
                    }
                    logger.log('Quiz loaded:', fetchedQuiz);
                } else {
                    throw new Error(t('error_quiz_not_found', 'לא ניתן לטעון את הטופס.'));
                }

            } catch (err) {
                logger.error('Error loading quiz:', err);
                setError(t('error_loading_quiz', 'שגיאה בטעינת הטופס. נסה שוב.'));
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [individualQuizSheetId]);

    useEffect(() => {
        if (!quiz) {
            rememberKeyMapRef.current = {};
            setTestComplete(false);
            setTestScore(null);
            setTestResults({});
            setIsCalculating(false);
            setIsSubmitting(false);
            setSubmissionComplete(false);
            return;
        }

        const rememberKeyMap = {};
        const rememberedAnswers = {};
        const defaultAnswers = {};
        const mergedAnswersForScore = {};

        quiz.getPages().forEach(page => {
            page.getElements().forEach(item => {
                if (item.category === 'question' && item.rememberLastAnswer) {
                    const storageKey = buildRememberStorageKey(item.rememberKey, individualQuizSheetId, item.id);
                    rememberKeyMap[item.id] = storageKey;
                    const savedValue = getRememberedValue(storageKey);
                    if (savedValue !== null && savedValue !== undefined && savedValue !== '') {
                        rememberedAnswers[item.id] = savedValue;
                        mergedAnswersForScore[item.id] = savedValue;
                    } else if (item.defaultAnswer !== undefined && item.defaultAnswer !== null && item.defaultAnswer !== '') {
                        defaultAnswers[item.id] = item.defaultAnswer;
                        mergedAnswersForScore[item.id] = item.defaultAnswer;
                    }
                } else if (item.category === 'question' && item.defaultAnswer !== undefined && item.defaultAnswer !== null && item.defaultAnswer !== '') {
                    defaultAnswers[item.id] = item.defaultAnswer;
                    mergedAnswersForScore[item.id] = item.defaultAnswer;
                }
            });
        });

        rememberKeyMapRef.current = rememberKeyMap;
        if (Object.keys(rememberedAnswers).length > 0 || Object.keys(defaultAnswers).length > 0) {
            setUserAnswers(prevAnswers => ({
                ...rememberedAnswers,
                ...defaultAnswers,
                ...prevAnswers,
            }));
        }
        const completed = getCompletionStatus(individualQuizSheetId);
        setSubmissionComplete(completed);
        if (completed) {
            const storedSummary = getCompletionSummary(individualQuizSheetId);
            if (storedSummary) {
                setTestScore({
                    total: storedSummary.total,
                    correct: storedSummary.correct,
                    percent: storedSummary.percent,
                });
                setTestResults(storedSummary.results || {});
                setTestComplete(true);
            } else if (quiz.testEnabled) {
                const computedSummary = calculateQuizScore(quiz, mergedAnswersForScore);
                setTestScore(computedSummary);
                setTestResults(computedSummary.results || {});
                setTestComplete(true);
            }
            const totalPages = quiz.getPages().length + (quiz.testEnabled ? 1 : 0);
            setCurrentPageIndex(Math.max(totalPages - 1, 0));
        }
    }, [quiz, individualQuizSheetId]);

    useEffect(() => {
        if (!quiz) {
            return;
        }
        const defaults = buildDefaultAnswers(quiz);
        setUserAnswers(defaults);
        setValidationErrors({});
        setCurrentPageIndex(0);
        setTestComplete(false);
        setTestScore(null);
        setTestResults({});
        setIsCalculating(false);
        setIsSubmitting(false);
        setSubmissionComplete(false);
        clearCompletionStatus(individualQuizSheetId);
    }, [resetToken]);

    const runValidation = useCallback((formInput, value) => {
        let errorMessage = '';

        if (formInput.isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
            const requiredFallback = formInput.inputContext === 'question'
                ? t('error_required_question', 'שאלת חובה.')
                : t('error_required', 'שדה חובה.');
            errorMessage = formInput.errorMessage || requiredFallback;
        } else if (formInput.validationRegex && value) {
            const normalizedRegex = normalizeRegexString(formInput.validationRegex);
            try {
                const regex = new RegExp(normalizedRegex);
                if (!regex.test(value)) {
                    errorMessage = formInput.errorMessage || t('error_invalid_format', 'פורמט לא תקין.');
                }
            } catch (e) {
                logger.error('Error during regex validation:', formInput.validationRegex, e);
                errorMessage = t('error_invalid_rule', 'כלל אימות לא תקין.');
            }
        }
        return errorMessage;
    }, []);

    const handleAnswerChange = (formInputId, answer) => {
        const stringAnswer = String(answer);
        logger.log(`Answer changed for ${formInputId}:`, stringAnswer);
        const storageKey = rememberKeyMapRef.current[formInputId];
        if (storageKey) {
            saveRememberedValue(storageKey, stringAnswer);
        }
        if (quiz && quiz.testEnabled && !submissionComplete) {
            setTestComplete(false);
            setTestScore(null);
            setTestResults({});
            setIsCalculating(false);
        }
        setUserAnswers(prevAnswers => ({
            ...prevAnswers,
            [formInputId]: stringAnswer
        }));

        // Validate immediately after change
        if (quiz) {
            const currentPages = quiz.getPages();
            const currentPage = currentPages[currentPageIndex];
            const formInput = currentPage.getElements().find(el => el.id === formInputId);
            if (formInput && formInput.category === 'question') {
                const errorMessage = runValidation(formInput, stringAnswer);
                setValidationErrors(prevErrors => ({
                    ...prevErrors,
                    [formInputId]: errorMessage
                }));
            }
        }
    };

    const validatePage = () => {
        if (!quiz) return true;

        const currentPages = quiz.getPages();
        const currentPage = currentPages[currentPageIndex];
        if (!currentPage) {
            return true;
        }
        let pageIsValid = true;
        const newValidationErrors = {};

        currentPage.getElements().forEach(formInput => {
            if (formInput.category === 'question') {
                const value = userAnswers[formInput.id];
                const errorMessage = runValidation(formInput, value);
                if (errorMessage) {
                    newValidationErrors[formInput.id] = errorMessage;
                    pageIsValid = false;
                }
            }
        });

        setValidationErrors(newValidationErrors);
        return pageIsValid;
    };

    const handleNextPage = () => {
        logger.log('Attempting to navigate to next page.');
        if (validatePage()) {
            setCurrentPageIndex(prevIndex => prevIndex + 1);
            logger.log('Navigated to next page. Current page index:', currentPageIndex + 1);
        } else {
            logger.warn('Cannot navigate to next page: current page validation failed.');
        }
    };

    const handlePrevPage = () => {
        logger.log('Navigating to previous page. Current page index:', currentPageIndex - 1);
        setCurrentPageIndex(prevIndex => prevIndex - 1);
    };

    const handleFinishTest = () => {
        if (!quiz) {
            return;
        }
        if (isCalculating) {
            return;
        }
        setIsCalculating(true);
        const delayMs = 1500 + Math.floor(Math.random() * 1500);
        window.setTimeout(() => {
            const scoreSummary = calculateQuizScore(quiz, userAnswers);
            setTestScore(scoreSummary);
            setTestComplete(true);
            setTestResults(scoreSummary.results || {});
            setIsCalculating(false);
        }, delayMs);
    };

    const handleSubmit = async () => {
        logger.log('Attempting to submit quiz.');
        if (!validatePage()) {
            logger.warn('Quiz submission prevented: current page validation failed.');
            return;
        }

        if (isSubmitting || submissionComplete) {
            return;
        }

        try {
            setIsSubmitting(true);
            let summaryForSubmit = null;
            if (quiz && quiz.testEnabled) {
                summaryForSubmit = testScore || calculateQuizScore(quiz, userAnswers);
                if (summaryForSubmit) {
                    setTestScore(summaryForSubmit);
                    setTestResults(summaryForSubmit.results || {});
                    setTestComplete(true);
                }
            }
            const normalizedAnswers = normalizePhoneAnswers(quiz, userAnswers);
            const withHiddenAnswers = applyHiddenAnswers(quiz, normalizedAnswers, {
                quizSheetId: individualQuizSheetId,
                responseSheetId: quiz.responseSheetId,
            });
            logger.log('Submitting quiz with answers:', withHiddenAnswers);
            const result = await submitQuiz(individualQuizSheetId, quiz.responseSheetId, withHiddenAnswers);
            if (result.success) {
                logger.log('Quiz submitted successfully.', result);
                setSubmissionComplete(true);
                markCompletionStatus(individualQuizSheetId, summaryForSubmit || testScore, summaryForSubmit ? summaryForSubmit.results : testResults);
                setPopupState({
                    open: true,
                    message: t('submit_success', 'הטופס נשלח בהצלחה!'),
                    type: 'success',
                    action: 'back',
                });
            } else {
                logger.error('Error submitting quiz:', result.message);
                setPopupState({
                    open: true,
                    message: t('submit_error_generic', 'שגיאה בשליחת הטופס.'),
                    type: 'error',
                    action: '',
                });
            }
        } catch (err) {
            logger.error('Error during quiz submission process:', err);
            setPopupState({
                open: true,
                message: t('submit_error_network', 'שגיאת רשת במהלך שליחת הטופס.'),
                type: 'error',
                action: '',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClosePopup = () => {
        setPopupState(prev => ({ ...prev, open: false }));
        if (popupState.action === 'back') {
            onBack();
        }
    };

    if (loading) {
        logger.log('QuizDisplay: Loading state active.');
        return <div className="loading-message">{t('loading_quiz', 'טוען...')}</div>;
    }

    if (error) {
        logger.error('QuizDisplay: Error state active.', error);
        return <div className="error-message">{error}</div>;
    }

    if (!quiz) {
        logger.warn('QuizDisplay: No quiz data available.');
        return <div className="no-quiz-data">{t('no_quiz_data', 'אין נתוני טופס.')}</div>;
    }

    const basePages = quiz.getPages();
    const isTestEnabled = quiz.testEnabled;
    const pages = isTestEnabled
        ? [...basePages, { id: '__test__', title: quiz.testTitle || t('test_page_title', 'סיכום מבחן'), description: quiz.testDescription || '' }]
        : basePages;
    const currentPage = pages[currentPageIndex];
    const isLastPage = currentPageIndex === pages.length - 1;
    const isTestPage = isTestEnabled && currentPage && currentPage.id === '__test__';
    const minScore = quiz.minScore !== null && !Number.isNaN(quiz.minScore) ? Number(quiz.minScore) : 0;
    const passedTest = testScore ? testScore.percent >= minScore : false;

    logger.log('QuizDisplay: Rendering page:', currentPage.id, 'Index:', currentPageIndex);

    return (
        <div
            id="quiz-display"
            className={`quiz-display${submissionComplete ? ' quiz-display--submitted' : ''}`}
            dir={quiz.direction || 'ltr'}
        >
            <header className="quiz-header">
                <div className="quiz-header-title">
                    <h2 id="quiz-title">{quiz.title}</h2>
                </div>
            </header>

            <main className="quiz-content">
                <p id="quiz-description">{quiz.description}</p>

                {isTestPage ? (
                    <section className="quiz-test-panel">
                        {currentPage.title && <h3 className="quiz-test-title">{currentPage.title}</h3>}
                        {currentPage.description && <p className="quiz-test-description">{currentPage.description}</p>}
                        {!testComplete && !isCalculating && !submissionComplete && (
                            <p className="quiz-test-hint">{t('test_hint', 'כדי לראות את התוצאה, לחץ על “סיים מבחן”.')}</p>
                        )}
                        {isCalculating && (
                            <div className="quiz-test-processing" role="status" aria-live="polite">
                                <span className="quiz-test-spinner" aria-hidden="true" />
                                <span>{t('test_processing', 'בודק את התוצאות...')}</span>
                            </div>
                        )}
                        {testScore && (
                            <div className="quiz-test-score">
                                {submissionComplete && (
                                    <div className="quiz-test-success">{t('submit_success_inline', 'נשלח בהצלחה')}</div>
                                )}
                                <div className="quiz-test-score-value">
                                    {t('test_score_label', 'ציון')}: {testScore.correct}/{testScore.total} ({testScore.percent}%)
                                </div>
                                <div className={`quiz-test-status ${passedTest ? 'pass' : 'fail'}`}>
                                    {passedTest ? t('test_pass', 'עברת בהצלחה') : t('test_fail', 'לא עברת את המינימום')}
                                </div>
                                {minScore > 0 && (
                                    <div className="quiz-test-min">{t('test_min_score', 'ציון מעבר')}: {minScore}%</div>
                                )}
                            </div>
                        )}
                    </section>
                ) : (
                    <Page
                        page={currentPage}
                        onAnswerChange={handleAnswerChange}
                        userAnswers={userAnswers}
                        validationErrors={validationErrors} // Pass down validation errors
                        testResults={testComplete ? testResults : null}
                        showTestIcons={quiz.testShowIcons !== false}
                    />
                )}
            </main>

            {submissionComplete && !isSubmitting && (
                <div className="quiz-submit-success-banner">
                    {t('submit_success_inline', 'נשלח בהצלחה')}
                </div>
            )}
            <footer className="quiz-footer">
                <div className="quiz-footer-inner">
                    <div className="quiz-navigation">
                        {currentPageIndex > 0 && (
                            <button onClick={handlePrevPage} className="prev-button">{t('prev_button', 'הקודם')}</button>
                        )}
                        {!isLastPage && (
                            <button onClick={handleNextPage} className="next-button">{t('next_button', 'הבא')}</button>
                        )}
                        {isTestPage && (
                            <button
                                onClick={handleFinishTest}
                                className={`next-button${submissionComplete ? ' quiz-nav-button--locked' : ''}`}
                                disabled={isCalculating || submissionComplete}
                            >
                                {t('finish_test_button', 'סיים מבחן')}
                            </button>
                        )}
                        {isLastPage && !isTestPage && (
                            <button
                                onClick={handleSubmit}
                                id="submit-quiz"
                                className={`submit-button${submissionComplete ? ' quiz-nav-button--locked' : ''}`}
                                disabled={isSubmitting || submissionComplete}
                            >
                                {t('submit_quiz_button', 'שלח טופס')}
                            </button>
                        )}
                        {isTestPage && testComplete && passedTest && (
                            <button
                                onClick={handleSubmit}
                                id="submit-quiz"
                                className={`submit-button${submissionComplete ? ' quiz-nav-button--locked' : ''}`}
                                disabled={isSubmitting || submissionComplete}
                            >
                                {t('submit_quiz_button', 'שלח טופס')}
                            </button>
                        )}
                    </div>
                    {isSubmitting && (
                        <div className="quiz-submit-processing" role="status" aria-live="polite">
                            <span className="quiz-test-spinner" aria-hidden="true" />
                            <span>{t('submit_processing', 'שולח את הטופס...')}</span>
                        </div>
                    )}
                    {submissionComplete && !isSubmitting && (
                        <div className="quiz-submit-locked" role="status" aria-live="polite">
                            {t('submit_locked', 'הטופס כבר נשלח. לחץ על “מלא טופס מחדש” כדי לשלוח שוב.')}
                        </div>
                    )}
                </div>
            </footer>
            {popupState.open && (
                <div className="quiz-popup-overlay" role="dialog" aria-modal="true">
                    <div className={`quiz-popup quiz-popup--${popupState.type}`}>
                        <div className="quiz-popup-message">{popupState.message}</div>
                        <button type="button" className="quiz-popup-button" onClick={handleClosePopup}>
                            {popupState.action === 'back'
                                ? t('popup_back', 'חזרה לרשימת הטפסים')
                                : t('popup_close', 'סגור')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function buildRememberStorageKey(rememberKey, quizSheetId, formInputId) {
    if (rememberKey && String(rememberKey).trim()) {
        return `quiz:remember:${String(rememberKey).trim()}`;
    }
    return `quiz:remember:${quizSheetId || 'default'}:${formInputId}`;
}

function getRememberedValue(storageKey) {
    try {
        return window.localStorage.getItem(storageKey);
    } catch (error) {
        logger.warn('Failed to read remembered answer:', error.message);
        return null;
    }
}

function saveRememberedValue(storageKey, value) {
    try {
        window.localStorage.setItem(storageKey, value);
    } catch (error) {
        logger.warn('Failed to store remembered answer:', error.message);
    }
}

function getCompletionKey(quizSheetId) {
    return `quiz:completed:${quizSheetId || 'default'}`;
}

function getCompletionSummaryKey(quizSheetId) {
    return `quiz:completed:summary:${quizSheetId || 'default'}`;
}

function getCompletionStatus(quizSheetId) {
    try {
        return window.localStorage.getItem(getCompletionKey(quizSheetId)) === 'true';
    } catch (error) {
        logger.warn('Failed to read completion status:', error.message);
        return false;
    }
}

function markCompletionStatus(quizSheetId, summary, results) {
    try {
        window.localStorage.setItem(getCompletionKey(quizSheetId), 'true');
        if (summary && typeof summary === 'object') {
            const payload = {
                total: summary.total,
                correct: summary.correct,
                percent: summary.percent,
                results: results || summary.results || {},
            };
            window.localStorage.setItem(getCompletionSummaryKey(quizSheetId), JSON.stringify(payload));
        }
    } catch (error) {
        logger.warn('Failed to store completion status:', error.message);
    }
}

function getCompletionSummary(quizSheetId) {
    try {
        const raw = window.localStorage.getItem(getCompletionSummaryKey(quizSheetId));
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return parsed;
    } catch (error) {
        logger.warn('Failed to read completion summary:', error.message);
        return null;
    }
}

function clearCompletionStatus(quizSheetId) {
    try {
        window.localStorage.removeItem(getCompletionKey(quizSheetId));
        window.localStorage.removeItem(getCompletionSummaryKey(quizSheetId));
    } catch (error) {
        logger.warn('Failed to clear completion status:', error.message);
    }
}

function normalizePhoneAnswers(quiz, answers) {
    if (!quiz) {
        return answers;
    }
    const normalized = { ...answers };
    quiz.getPages().forEach(page => {
        page.getElements().forEach(item => {
            if (item.subType === 'phone' && normalized[item.id]) {
                normalized[item.id] = formatPhoneValue(normalized[item.id]);
            }
        });
    });
    return normalized;
}

function formatPhoneValue(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length <= 3) {
        return digits;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

function applyHiddenAnswers(quiz, answers, context) {
    if (!quiz) {
        return answers;
    }
    const nextAnswers = { ...answers };
    const urlParams = Object.fromEntries(new URLSearchParams(window.location.search));
    const evalContext = {
        ...context,
        url: window.location.href,
        params: urlParams,
        userAgent: navigator.userAgent,
        now: new Date().toISOString(),
    };

    quiz.getPages().forEach(page => {
        page.getElements().forEach(item => {
            if (item.subType !== 'hidden') {
                return;
            }
            if (item.hiddenValueJs) {
                nextAnswers[item.id] = evaluateHiddenValue(item.hiddenValueJs, evalContext);
            } else if (item.hiddenValue !== undefined && item.hiddenValue !== null) {
                nextAnswers[item.id] = String(item.hiddenValue);
            }
        });
    });

    return nextAnswers;
}

function buildDefaultAnswers(quiz) {
    const defaults = {};
    if (!quiz) {
        return defaults;
    }
    quiz.getPages().forEach(page => {
        page.getElements().forEach(item => {
            if (item.category === 'question' && item.defaultAnswer !== undefined && item.defaultAnswer !== null && item.defaultAnswer !== '') {
                defaults[item.id] = item.defaultAnswer;
            }
        });
    });
    return defaults;
}

function evaluateHiddenValue(code, context) {
    try {
        const trimmed = String(code || '').trim();
        if (!trimmed) {
            return '';
        }
        let fn;
        try {
            fn = new Function('context', `"use strict"; return (${trimmed});`);
        } catch (error) {
            fn = new Function('context', `"use strict"; ${trimmed}`);
        }
        const result = fn(context);
        if (result === undefined || result === null) {
            return '';
        }
        return String(result);
    } catch (error) {
        logger.warn('Failed to evaluate hidden value JS:', error.message);
        return '';
    }
}

function calculateQuizScore(quiz, answers) {
    let total = 0;
    let correct = 0;
    const results = {};
    quiz.getPages().forEach(page => {
        page.getElements().forEach(item => {
            if (item.category !== 'question' || item.inputContext !== 'question') {
                return;
            }
            const expected = item.rightAnswer;
            if (!expected && expected !== 0) {
                results[item.id] = null;
                return;
            }
            total += 1;
            const userValue = answers[item.id];
            const isCorrect = isAnswerCorrect(userValue, expected, item.subType);
            results[item.id] = isCorrect;
            if (isCorrect) {
                correct += 1;
            }
        });
    });
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, percent, results };
}

function isAnswerCorrect(value, expected, subType) {
    if (subType === 'multi_choice') {
        return compareMultiChoice(value, expected);
    }
    const actual = normalizeAnswer(value);
    const target = normalizeAnswer(expected);
    return actual === target;
}

function normalizeAnswer(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim().toLowerCase();
}

function compareMultiChoice(value, expected) {
    const actualList = splitAnswerList(value);
    const expectedList = splitAnswerList(expected);
    if (actualList.length !== expectedList.length) {
        return false;
    }
    actualList.sort();
    expectedList.sort();
    return actualList.every((item, index) => item === expectedList[index]);
}

function splitAnswerList(value) {
    if (value === undefined || value === null) {
        return [];
    }
    return String(value)
        .split(';')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
}

export default QuizDisplay;
