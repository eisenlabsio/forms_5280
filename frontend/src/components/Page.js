import React from 'react';
import QuizElementMap from './QuizElementMap';
import logger from '../utils/logger';

function Page({ page, onAnswerChange, userAnswers, validationErrors, testResults, showTestIcons }) { // Receive validationErrors
    let questionNumberCounter = 0;

    logger.log('Page component received page prop:', page);
    const elements = page.getElements();
    logger.log('Page elements to render:', elements);

    return (
        <div className="quiz-page" id={`page-${page.id}`}>
            <h3>{page.title}</h3>
            {page.description && <p>{page.description}</p>}

            <div className="page-elements">
                {elements.map((item, index) => {
                    logger.log(`Page: Rendering item with subType "${item.subType}" and id "${item.id}".`);

                    const ElementComponent = QuizElementMap[item.subType];

                    logger.log(`Page: ElementComponent for subType "${item.subType}":`, ElementComponent ? 'Found' : 'Not Found');

                    if (!ElementComponent) {
                        return null;
                    }

                    const elementProps = {
                        element: item, // Pass the FormInput instance as 'element'
                        localError: validationErrors[item.id], // Pass down specific error
                    };
                    const elementKey = item.id || index;

                    if (item.category === 'question') {
                        questionNumberCounter++;
                        elementProps.question = item; // For backward compatibility with specific question components
                        elementProps.questionNumber = questionNumberCounter;
                        elementProps.onAnswerChange = onAnswerChange;
                        elementProps.currentAnswer = userAnswers[item.id];
                        
                        const questionLabel = `${questionNumberCounter}. ${item.text}`;
                        const elementId = item.elementId || item.id;
                        const status = showTestIcons && testResults && Object.prototype.hasOwnProperty.call(testResults, item.id)
                            ? testResults[item.id]
                            : null;

                        return (
                            <div key={elementKey} className="question-block" data-element-id={elementId}>
                                <p className="question-text">
                                    <span className="question-text-label">{questionLabel}</span>
                                    {status === true && (
                                        <span className="question-status-icon correct" aria-label="נכון">✓</span>
                                    )}
                                    {status === false && (
                                        <span className="question-status-icon incorrect" aria-label="לא נכון">✕</span>
                                    )}
                                </p>
                                <div className="input-area">
                                    <ElementComponent key={elementKey} {...elementProps} />
                                </div>
                            </div>
                        );
                    }

                    // For non-question elements, simply return the component
                    return <ElementComponent key={elementKey} {...elementProps} />;
                })}
            </div>
        </div>
    );
}

export default Page;
