import { Quiz } from '../models/Quiz';
import { Page } from '../models/Page';
import { FormInput } from '../models/FormInput';
import { TextFormInput } from '../models/TextFormInput';
import { NumberFormInput } from '../models/NumberFormInput';
import { ChoiceFormInput } from '../models/ChoiceFormInput';
import { DropdownFormInput } from '../models/DropdownFormInput';
import { MultiChoiceFormInput } from '../models/MultiChoiceFormInput';
import { DateFormInput } from '../models/DateFormInput';
import { TimeFormInput } from '../models/TimeFormInput';
import { DateTimeFormInput } from '../models/DateTimeFormInput';
import { LongTextFormInput } from '../models/LongTextFormInput';
import { PhoneFormInput } from '../models/PhoneFormInput';
import { SignatureFormInput } from '../models/SignatureFormInput';
import { InfoTextFormInput } from '../models/InfoTextFormInput';
import { DisplayHtmlFormInput } from '../models/DisplayHtmlFormInput';
import { HiddenFormInput } from '../models/HiddenFormInput';
import { parsePathValueSheet } from './sheetParser'; // Import from sheetParser.js
import { extractFontScaleConfig } from '../utils/fontScale';

const formInputSubTypeMap = {
    'text': TextFormInput,
    'number': NumberFormInput,
    'choice': ChoiceFormInput,
    'dropdown': DropdownFormInput,
    'multi_choice': MultiChoiceFormInput,
    'date': DateFormInput,
    'time': TimeFormInput,
    'datetime': DateTimeFormInput,
    'long_text': LongTextFormInput,
    'phone': PhoneFormInput,
    'signature': SignatureFormInput,
    'info_text': InfoTextFormInput,
    'display_html': DisplayHtmlFormInput,
    'hidden': HiddenFormInput,
};

function buildQuizFromObject(quizObject) {
    console.log('buildQuizFromObject: quizObject received:', quizObject); // Debugging, no JSON.stringify
    const quiz = new Quiz();

    quiz.title = quizObject.global?.quiz_title || '';
    quiz.description = quizObject.global?.quiz_description || '';
    quiz.responseSheetId = quizObject.global?.response_sheet_id || '';
    const quizDirection = quizObject.global?.quiz_direction;
    quiz.direction = quizDirection === 'rtl' || quizDirection === 'ltr' ? quizDirection : 'ltr';
    quiz.fontScaleConfig = extractFontScaleConfig(quizObject.global || {});
    const testEnabledValue = quizObject.global?.quiz_test_enabled;
    quiz.testEnabled = String(testEnabledValue || '').toUpperCase() === 'TRUE';
    const minScoreValue = quizObject.global?.quiz_min_score;
    quiz.minScore = minScoreValue !== undefined && minScoreValue !== null && String(minScoreValue).trim() !== ''
        ? Number(minScoreValue)
        : null;
    quiz.testTitle = quizObject.global?.quiz_test_title || '';
    quiz.testDescription = quizObject.global?.quiz_test_description || '';
    const showIconsValue = quizObject.global?.quiz_test_show_icons;
    quiz.testShowIcons = showIconsValue === undefined || showIconsValue === null || String(showIconsValue).trim() === ''
        ? true
        : String(showIconsValue).toUpperCase() === 'TRUE';

    const pageDefs = {};
    if (quizObject.global) {
        for (const key in quizObject.global) {
            console.log(`Checking global key: ${typeof key} ${key}, endsWith('_page_def'): ${key.endsWith('_page_def')}`); // Debugging
            if (key.endsWith('_page_def')) {
                const pageDef = quizObject.global[key];
                pageDefs[pageDef.page_id] = pageDef;
            }
        }
    }
    if (quizObject.question) {
        for (const key in quizObject.question) {
            console.log(`Checking question key: ${typeof key} ${key}, endsWith('_page_def'): ${key.endsWith('_page_def')}`); // Debugging
            if (key.endsWith('_page_def')) {
                const pageDef = quizObject.question[key];
                pageDefs[pageDef.page_id] = pageDef;
            }
        }
    }
    console.log('pageDefs after processing quizObject:', pageDefs); // Debugging

    for (const pageId in pageDefs) {
        console.log('Processing pageId:', pageId); // Debugging
        const pageDef = pageDefs[pageId];
        const page = new Page(pageDef.page_id, pageDef.page_title, pageDef.page_description);
        if (pageDef.page_show_if_question_id) {
            page.showIfQuestionId = pageDef.page_show_if_question_id;
        }
        if (pageDef.page_show_if_operator) {
            page.showIfOperator = pageDef.page_show_if_operator;
        }
        if (pageDef.page_show_if_value !== undefined) {
            page.showIfValue = pageDef.page_show_if_value;
        }
        quiz.addPage(page);
    }
    
    if (quizObject.question) {
        for (const pageId in quizObject.question) {
            if (!pageId.endsWith('_page_def')) {
                const page = quiz.getPage(pageId);
                if (page) {
                    const formInputGroup = quizObject.question[pageId];
                    for (const formInputKey in formInputGroup) {
                        const formInputData = formInputGroup[formInputKey];
                        const formInputSubType = formInputData.type || formInputData.question_type;

                        const FormInputClass = formInputSubTypeMap[formInputSubType];

                        if (FormInputClass) {
                            let formInputInstance;
                            if (formInputSubType === 'info_text') {
                                formInputInstance = new FormInputClass(formInputData.id || formInputKey, formInputData.text || formInputData.question);
                            } else if (formInputSubType === 'display_html') {
                                formInputInstance = new FormInputClass(formInputData.id || formInputKey, formInputData.html || formInputData.text || '');
                            } else if (formInputSubType === 'hidden') {
                                formInputInstance = new FormInputClass(formInputData.question_id || formInputKey);
                            } else {
                                formInputInstance = new FormInputClass(formInputData.question_id || formInputKey, formInputData.question, formInputData.question_is_required === 'TRUE');
                            }

                            // Preserve the original element id for UI hooks/tests when question_id differs.
                            formInputInstance.elementId = formInputKey;
                            if (formInputData.input_context) {
                                formInputInstance.inputContext = formInputData.input_context;
                            }
                            
                            if (formInputData.question_right_answer) {
                                formInputInstance.rightAnswer = formInputData.question_right_answer;
                            }
                            if (formInputData.question_validation_regex) {
                                formInputInstance.validationRegex = formInputData.question_validation_regex;
                            }
                            if (formInputData.question_error_message) {
                                formInputInstance.errorMessage = formInputData.question_error_message;
                            }
                            if (formInputData.question_placeholder) {
                                formInputInstance.placeholder = formInputData.question_placeholder;
                            }
                            const rememberLastRaw = formInputData.question_remember_last;
                            const rememberLastExplicit = rememberLastRaw !== undefined && rememberLastRaw !== null && String(rememberLastRaw).trim() !== '';
                            const rememberLastValue = rememberLastExplicit ? String(rememberLastRaw).toUpperCase() === 'TRUE' : null;

                            if (formInputData.question_remember_key) {
                                formInputInstance.rememberKey = formInputData.question_remember_key;
                                formInputInstance.rememberLastAnswer = rememberLastValue !== null ? rememberLastValue : true;
                            } else if (rememberLastExplicit) {
                                formInputInstance.rememberLastAnswer = rememberLastValue;
                            } else if (formInputInstance.category === 'question') {
                                formInputInstance.rememberLastAnswer = true;
                            }
                            if (formInputData.question_default_answer) {
                                formInputInstance.defaultAnswer = formInputData.question_default_answer;
                            }
                            if (formInputData.question_value) {
                                formInputInstance.hiddenValue = formInputData.question_value;
                            }
                            if (formInputData.question_value_js) {
                                formInputInstance.hiddenValueJs = formInputData.question_value_js;
                            }
                            if ((formInputSubType === 'multi_choice' || formInputSubType === 'choice' || formInputSubType === 'dropdown') && formInputData.question_option) {
                                const options = Array.isArray(formInputData.question_option) ? formInputData.question_option : [formInputData.question_option];
                                options.forEach(option => formInputInstance.addOption(option));
                            }
                            page.addElement(formInputInstance);
                        }
                    }
                }
            }
        }
    }

    return quiz;
}


export function parseQuizSheet(sheetData) {
    const quizObject = parsePathValueSheet(sheetData);
    return buildQuizFromObject(quizObject);
}
