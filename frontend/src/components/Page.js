import React from 'react';
import QuizElementMap from './QuizElementMap';
import logger from '../utils/logger';

function Page({ page, onAnswerChange, userAnswers, validationErrors }) { // Receive validationErrors
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
                        key: item.id || index,
                        element: item, // Pass the FormInput instance as 'element'
                        localError: validationErrors[item.id], // Pass down specific error
                    };

                    if (item.category === 'question') {
                        questionNumberCounter++;
                        elementProps.question = item; // For backward compatibility with specific question components
                        elementProps.questionNumber = questionNumberCounter;
                        elementProps.onAnswerChange = onAnswerChange;
                        elementProps.currentAnswer = userAnswers[item.id];
                        
                        const questionLabel = `${questionNumberCounter}. ${item.text}`;
                        const elementId = item.elementId || item.id;

                        return (
                            <div key={item.id || index} className="question-block" data-element-id={elementId}>
                                <p className="question-text">{questionLabel}</p>
                                <div className="input-area">
                                    <ElementComponent {...elementProps} />
                                </div>
                            </div>
                        );
                    }

                    // For non-question elements, simply return the component
                    return <ElementComponent {...elementProps} />;
                })}
            </div>
        </div>
    );
}

export default Page;
