import React, { useState } from 'react';
import QuizSelection from './components/QuizSelection';
import QuizDisplay from './components/QuizDisplay';
import FormParserTool from './components/FormParserTool';
import './App.css'; // Assuming you will create a new App.css later or rename index.css

function App() {
    const [selectedQuiz, setSelectedQuiz] = useState(null); // { id, title, description, responseSheetId }
    const tool = new URLSearchParams(window.location.search).get('tool');

    const handleQuizSelect = (id, title, description, responseSheetId) => {
        setSelectedQuiz({ id, title, description, responseSheetId });
    };

    const handleBackToSelection = () => {
        setSelectedQuiz(null);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Quiz Application</h1>
            </header>
            <main>
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
                    <QuizSelection onQuizSelect={handleQuizSelect} />
                )}
            </main>
        </div>
    );
}

export default App;
