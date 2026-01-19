import React from 'react';
import QuizElementMap from './QuizElementMap';

function Page({ page, onAnswerChange, userAnswers }) {
    let questionNumberCounter = 0; // Reset question numbering for each page

    return (
        <div className="quiz-page" id={`page-${page.page_id}`}>
            <h3>{page.page_title}</h3>
            {page.page_description && <p>{page.page_description}</p>}

            <div className="page-elements">
                {page.elements.map((item, index) => {
                    const ElementComponent = QuizElementMap[item.type];
                    if (item.type === 'section_title') {
                        return <h4 key={index} className="section-title">{item.value}</h4>;
                    } else if (ElementComponent) {
                        const elementProps = {
                            key: item.element_id || index,
                            element: item,
                        };

                        if (item.type === 'question') {
                            questionNumberCounter++;
                            elementProps.question = item;
                            elementProps.questionNumber = questionNumberCounter;
                            elementProps.onAnswerChange = onAnswerChange;
                            elementProps.currentAnswer = userAnswers[item.element_id];
                        }
                        return <ElementComponent {...elementProps} />;
                    }
                    return null;
                })}
            </div>
        </div>
    );
}

export default Page;