import React, { useState } from 'react';
import QuizSelection from './components/QuizSelection';
import QuizDisplay from './components/QuizDisplay';
import FormParserTool from './components/FormParserTool';
import { useQuiz } from './context/QuizContext';
import './App.css'; // Assuming you will create a new App.css later or rename index.css

function App() {
    const [selectedQuiz, setSelectedQuiz] = useState(null); // { id, title, description, responseSheetId }
    const tool = new URLSearchParams(window.location.search).get('tool');
    const { contentData } = useQuiz();
    const [appHeaderTitle, setAppHeaderTitle] = useState('');
    const appTitle = appHeaderTitle || contentData.app_title || 'Quiz Application';
    const backLabel = contentData.back_to_quiz_list || 'Back to Quiz Selection';

    const handleQuizSelect = (id, title, description, responseSheetId) => {
        setSelectedQuiz({ id, title, description, responseSheetId });
    };

    const handleBackToSelection = () => {
        setSelectedQuiz(null);
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className="app-header-inner">
                    <div className="app-header-title">
                        <h1>{appTitle}</h1>
                    </div>
                    {selectedQuiz && (
                        <div className="app-header-actions">
                            <button
                                onClick={handleBackToSelection}
                                className="back-button app-back-button"
                                title={backLabel}
                                aria-label={backLabel}
                            >
                                <svg className="back-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                                    <path d="M12.5 4L7 10l5.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    )}
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
                    />
                ) : (
                    <QuizSelection
                        onQuizSelect={handleQuizSelect}
                        onMasterConfig={(config) => setAppHeaderTitle(config?.title || '')}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
