import React, { useState, useEffect, useRef } from 'react';
import QuizSelection from './components/QuizSelection';
import QuizDisplay from './components/QuizDisplay';
import FormParserTool from './components/FormParserTool';
import { useQuiz } from './context/QuizContext';
import { resolveFontScale } from './utils/fontScale';
import './App.css'; // Assuming you will create a new App.css later or rename index.css

function App() {
    const [selectedQuiz, setSelectedQuiz] = useState(null); // { id, title, description, responseSheetId }
    const tool = new URLSearchParams(window.location.search).get('tool');
    const { contentData } = useQuiz();
    const [appHeaderTitle, setAppHeaderTitle] = useState('');
    const [masterFontScaleConfig, setMasterFontScaleConfig] = useState(null);
    const [quizFontScaleConfig, setQuizFontScaleConfig] = useState(null);
    const [resetCounter, setResetCounter] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [masterDirection, setMasterDirection] = useState('ltr');
    const [appDirection, setAppDirection] = useState('ltr');
    const appTitle = appHeaderTitle || contentData.app_title || 'אפליקציית טפסים';
    const backLabel = contentData.back_to_quiz_list || 'חזרה לרשימת הטפסים';
    const menuLabel = contentData.menu_label || 'תפריט';
    const resetLabel = contentData.reset_form || 'מלא טופס מחדש';
    const titleContainerRef = useRef(null);
    const titleRef = useRef(null);
    const menuRef = useRef(null);
    const activeFontScale = resolveFontScale(quizFontScaleConfig || masterFontScaleConfig);

    useEffect(() => {
        const titleEl = titleRef.current;
        const containerEl = titleContainerRef.current;
        if (!titleEl || !containerEl) {
            return;
        }

        const maxFontSize = 32 * activeFontScale;
        const minFontSize = 16 * activeFontScale;
        let rafId = null;
        let scheduled = false;

        const fitTitle = () => {
            const availableWidth = containerEl.clientWidth;
            if (!availableWidth) {
                return;
            }
            let fontSize = maxFontSize;
            titleEl.style.fontSize = `${fontSize}px`;
            titleEl.style.transform = '';
            while (fontSize > minFontSize && titleEl.scrollWidth > availableWidth) {
                fontSize -= 1;
                titleEl.style.fontSize = `${fontSize}px`;
            }
            if (titleEl.scrollWidth > availableWidth) {
                const ratio = availableWidth / titleEl.scrollWidth;
                const scaledSize = Math.floor(fontSize * ratio);
                const finalSize = Math.max(scaledSize, minFontSize);
                titleEl.style.fontSize = `${finalSize}px`;
            }
        };

        const scheduleFit = () => {
            if (scheduled) {
                return;
            }
            scheduled = true;
            rafId = window.requestAnimationFrame(() => {
                scheduled = false;
                fitTitle();
            });
        };

        scheduleFit();
        const resizeObserver = new ResizeObserver(scheduleFit);
        resizeObserver.observe(containerEl);

        return () => {
            resizeObserver.disconnect();
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, [appTitle, activeFontScale]);

    const handleQuizSelect = (id, title, description, responseSheetId) => {
        setSelectedQuiz({ id, title, description, responseSheetId });
    };

    const handleBackToSelection = () => {
        setSelectedQuiz(null);
        setQuizFontScaleConfig(null);
        setIsMenuOpen(false);
        setAppDirection(masterDirection);
    };

    const handleToggleMenu = () => {
        setIsMenuOpen(prev => !prev);
    };

    const handleResetForm = () => {
        setResetCounter(prev => prev + 1);
        setIsMenuOpen(false);
    };

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    return (
        <div className="App" style={{ '--text-scale': activeFontScale }} dir={appDirection}>
            <header className="App-header">
                <div className="app-header-inner">
                    <div className="app-header-title" ref={titleContainerRef}>
                        <h1 ref={titleRef}>{appTitle}</h1>
                    </div>
                    {selectedQuiz && (
                        <div className="app-header-menu" ref={menuRef}>
                            <button
                                type="button"
                                onClick={handleToggleMenu}
                                className="app-menu-button"
                                aria-label={menuLabel}
                                title={menuLabel}
                                aria-expanded={isMenuOpen}
                            >
                                <svg className="menu-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                            {isMenuOpen && (
                                <div className="app-menu-panel" role="menu">
                                    <button type="button" className="app-menu-item" onClick={handleBackToSelection}>
                                        <svg className="app-menu-item-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                                            <path d="M12.5 4L7 10l5.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="app-menu-item-label">{backLabel}</span>
                                    </button>
                                    <button type="button" className="app-menu-item" onClick={handleResetForm}>
                                        <svg className="app-menu-item-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                                            <path d="M16 5v4h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M4 10a6 6 0 0 0 10.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M4 10a6 6 0 0 1 10.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="app-menu-item-label">{resetLabel}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {selectedQuiz && <div className="app-header-actions" />}
                </div>
            </header>
            <main className="App-main">
                {tool === 'form-parser' ? (
                    <FormParserTool />
                ) : selectedQuiz ? (
                    <QuizDisplay
                        individualQuizSheetId={selectedQuiz.id}
                        quizTitle={selectedQuiz.title}
                        quizDescription={selectedQuiz.description}
                        responseSheetId={selectedQuiz.responseSheetId}
                        onBack={handleBackToSelection}
                        onQuizConfig={(config) => {
                            setQuizFontScaleConfig(config?.fontScaleConfig || null);
                            if (config?.direction) {
                                setAppDirection(config.direction === 'rtl' ? 'rtl' : 'ltr');
                            }
                        }}
                        resetToken={resetCounter}
                    />
                ) : (
                    <QuizSelection
                        onQuizSelect={handleQuizSelect}
                        onMasterConfig={(config) => {
                            setAppHeaderTitle(config?.title || '');
                            setMasterFontScaleConfig(config?.fontScaleConfig || null);
                            if (config?.direction) {
                                const dirValue = config.direction === 'rtl' ? 'rtl' : 'ltr';
                                setMasterDirection(dirValue);
                                setAppDirection(dirValue);
                            }
                        }}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
