import React, { useState, useEffect } from 'react';
import { fetchMasterSheet, fetchQuiz } from '../services/googleSheets';

function QuizSelection({ onQuizSelect }) {
    const [masterQuizTitle, setMasterQuizTitle] = useState('Quiz Selection');
    const [masterQuizDescription, setMasterQuizDescription] = useState('Select a quiz from the list below.');
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const masterSheetId = queryParams.get('sheetId');

        if (!masterSheetId) {
            setError('No sheetId parameter found in URL. Please provide a master sheet ID.');
            setLoading(false);
            return;
        }

        const loadMasterSheet = async () => {
            try {
                setLoading(true);
                const { masterQuizTitle, masterQuizDescription, individualQuizSheetIds } = await fetchMasterSheet(masterSheetId);
                setMasterQuizTitle(masterQuizTitle);
                setMasterQuizDescription(masterQuizDescription);

                // Fetch metadata for each individual quiz sheet
                const quizMetadataPromises = individualQuizSheetIds.map(async (quizInfo) => {
                    try {
                        const { quizTitle, quizDescription, responseSheetId, quizData } = await fetchQuiz(quizInfo.gid);
                        return {
                            individualQuizSheetId: quizInfo.gid,
                            quizTitle: quizTitle,
                            quizDescription: quizDescription,
                            responseSheetId: responseSheetId
                        };
                    } catch (err) {
                        console.error(`Error fetching metadata for quiz sheet ID ${quizInfo.gid}:`, err);
                        return null; // Return null for quizzes that failed to fetch metadata
                    }
                });

                const allQuizMetadata = await Promise.all(quizMetadataPromises);
                const validQuizzes = allQuizMetadata.filter(metadata => metadata !== null);
                setAvailableQuizzes(validQuizzes);
            } catch (err) {
                console.error('Error loading master sheet:', err);
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
        <div id="quiz-selection" className="quiz-selection">
            <h2>{masterQuizTitle}</h2>
            <p className="master-quiz-description">{masterQuizDescription}</p>
            <div id="quiz-list" className="quiz-list">
                {availableQuizzes.map(quiz => (
                    <div
                        key={quiz.individualQuizSheetId}
                        className="quiz-card"
                        onClick={() => onQuizSelect(quiz.individualQuizSheetId, quiz.quizTitle, quiz.quizDescription, quiz.responseSheetId)}
                    >
                        <h3>{quiz.quizTitle}</h3>
                        <p>{quiz.quizDescription}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default QuizSelection;
