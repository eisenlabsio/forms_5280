import Papa from 'papaparse';
import { parsePathValueSheet } from './sheetParser';

function extractFbLoadData(html) {
    if (!html || typeof html !== 'string') {
        throw new Error('Expected HTML string input.');
    }

    const primaryMatch = html.match(/FB_LOAD_DATA_\s*=\s*(\[.*?\]);\s*var\s+_docs_flag_cek/s);
    const fallbackMatch = html.match(/FB_LOAD_DATA_\s*=\s*(\[.*?\]);\s*<\/script>/s);
    const match = primaryMatch || fallbackMatch;

    if (!match || !match[1]) {
        throw new Error('Could not find FB_LOAD_DATA_ in the provided HTML.');
    }

    return JSON.parse(match[1]);
}

function isItemArray(value) {
    return Array.isArray(value)
        && value.length >= 4
        && typeof value[0] === 'number'
        && typeof value[1] === 'string'
        && typeof value[3] === 'number';
}

function hasAnswerKey(item) {
    if (!isItemArray(item)) {
        return false;
    }
    const questionData = item[4]?.[0];
    const answerBlock = questionData?.[9];
    return Array.isArray(answerBlock) && answerBlock.length >= 2 && Array.isArray(answerBlock[1]);
}

function findItemList(data) {
    const candidates = [];

    function walk(node) {
        if (Array.isArray(node)) {
            const itemCount = node.filter(isItemArray).length;
            if (itemCount > 0 && itemCount === node.length) {
                const containsAnswerKeys = node.some(hasAnswerKey);
                candidates.push({ list: node, itemCount, containsAnswerKeys });
            }
            node.forEach(walk);
        }
    }

    walk(data);

    if (candidates.length === 0) {
        return null;
    }

    const withKeys = candidates.filter(candidate => candidate.containsAnswerKeys);
    const pool = withKeys.length > 0 ? withKeys : candidates;

    pool.sort((a, b) => b.itemCount - a.itemCount);
    return pool[0].list;
}

function extractFormTitle(data) {
    const titleCandidate = data?.[0]?.[1]?.[8];
    if (typeof titleCandidate === 'string' && titleCandidate.trim()) {
        return titleCandidate.trim();
    }

    const secondaryCandidate = data?.[0]?.[3];
    if (typeof secondaryCandidate === 'string' && secondaryCandidate.trim()) {
        return secondaryCandidate.trim();
    }

    return 'Untitled Form';
}

function stripHtml(value) {
    if (!value || typeof value !== 'string') {
        return value;
    }
    if (!value.includes('<')) {
        return value;
    }
    return value
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<\/?div\s*>/gi, '\n')
        .replace(/<\/?p\s*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractFormDescription(data) {
    const directCandidate = data?.[0]?.[1]?.[0];
    if (typeof directCandidate === 'string' && directCandidate.trim()) {
        return stripHtml(directCandidate.trim());
    }

    const htmlCandidate = data?.[0]?.[1]?.[19]?.[0];
    if (typeof htmlCandidate === 'string' && htmlCandidate.trim()) {
        return stripHtml(htmlCandidate.trim());
    }

    return '';
}

function normalizeNewlines(value, mode) {
    if (typeof value !== 'string') {
        return value;
    }
    if (mode === 'preserve') {
        return value;
    }
    const replacement = mode === 'space' ? ' ' : '\\n';
    return value.replace(/\r\n|\r|\n/g, replacement);
}

function mapItemTypeToQuestionType(itemType) {
    switch (itemType) {
        case 0:
            return 'text';
        case 1:
            return 'long_text';
        case 2:
            return 'choice';
        case 3:
            return 'multi_choice';
        case 4:
            return 'dropdown';
        case 8:
            return 'date';
        case 9:
            return 'time';
        default:
            return 'text';
    }
}

function getQuestionOptions(item) {
    const options = item?.[4]?.[0]?.[1];
    if (!Array.isArray(options)) {
        return [];
    }

    return options
        .map(option => option?.[0])
        .filter(Boolean);
}

function getCorrectAnswers(item) {
    const answerBlock = item?.[4]?.[0]?.[9];
    if (!Array.isArray(answerBlock) || answerBlock.length < 2) {
        return [];
    }

    const answers = answerBlock[1];
    if (!Array.isArray(answers)) {
        return [];
    }

    return answers
        .map(answer => Array.isArray(answer) ? answer[0] : answer)
        .filter(Boolean);
}

function getIsRequired(item) {
    const requiredFlag = item?.[4]?.[0]?.[2];
    return requiredFlag === 1;
}

export function parseGoogleFormHtmlToConfig(html, options = {}) {
    const fbData = extractFbLoadData(html);
    const formTitle = extractFormTitle(fbData);
    const formDescription = options.quizDescription ?? extractFormDescription(fbData);
    const items = findItemList(fbData);

    if (!items || items.length === 0) {
        throw new Error('Could not locate form items in FB_LOAD_DATA_.');
    }

    const personalInfoCount = Number.isInteger(options.personalInfoCount) ? options.personalInfoCount : 0;
    const personalInfoPageId = options.personalInfoPageId || 'personal_info';
    const personalInfoPageTitle = options.personalInfoPageTitle || 'Personal Info';
    const quizPageId = options.quizPageId || 'quiz';
    const quizPageTitle = options.quizPageTitle || formTitle;
    const responseSheetId = options.responseSheetId || '';
    const valueNewlineMode = options.valueNewlineMode || 'preserve';

    const rows = [];
    const questionIds = [];
    rows.push({ path: 'global.quiz_title', value: formTitle });
    rows.push({ path: 'global.quiz_description', value: formDescription || '' });
    rows.push({ path: 'global.response_sheet_id', value: responseSheetId });

    if (personalInfoCount > 0) {
        rows.push({ path: `global.${personalInfoPageId}_page_def.page_id`, value: personalInfoPageId });
        rows.push({ path: `global.${personalInfoPageId}_page_def.page_title`, value: personalInfoPageTitle });
    }

    rows.push({ path: `global.${quizPageId}_page_def.page_id`, value: quizPageId });
    rows.push({ path: `global.${quizPageId}_page_def.page_title`, value: quizPageTitle });

    items.forEach((item, index) => {
        const itemId = item[0];
        const questionText = item[1];
        const itemType = item[3];
        const isRequired = getIsRequired(item) ? 'TRUE' : 'FALSE';

        const isPersonalInfo = index < personalInfoCount;
        const pageId = isPersonalInfo ? personalInfoPageId : quizPageId;
        const elementIndex = isPersonalInfo ? index + 1 : index - personalInfoCount + 1;
        const elementId = `Q${elementIndex}`;
        const questionId = `q_${itemId}`;

        rows.push({ path: `question.${pageId}.${elementId}.question`, value: questionText });
        rows.push({ path: `question.${pageId}.${elementId}.question_id`, value: questionId });
        questionIds.push(questionId);
        const questionType = mapItemTypeToQuestionType(itemType);
        rows.push({ path: `question.${pageId}.${elementId}.question_type`, value: questionType });
        rows.push({ path: `question.${pageId}.${elementId}.input_context`, value: isPersonalInfo ? 'input' : 'question' });

        const optionsList = getQuestionOptions(item);
        if (optionsList.length > 0) {
            optionsList.forEach(option => {
                rows.push({ path: `question.${pageId}.${elementId}.question_option`, value: option });
            });
        }

        const correctAnswers = getCorrectAnswers(item);
        if (correctAnswers.length > 0) {
            rows.push({ path: `question.${pageId}.${elementId}.question_right_answer`, value: correctAnswers.join(';') });
        }

        rows.push({ path: `question.${pageId}.${elementId}.question_is_required`, value: isRequired });
    });

    const normalizedRows = rows.map(row => ({
        ...row,
        value: normalizeNewlines(row.value, valueNewlineMode)
    }));

    const responseHeaders = [
        'Timestamp',
        'quizSheetId',
        'responseSheetId',
        'userAgent',
        'latitude',
        'longitude',
        'accuracy',
        'locationStatus',
        'clientIpAddress',
        ...questionIds
    ];

    const csv = Papa.unparse(normalizedRows, { header: true, skipEmptyLines: true });
    const responseHeaderCsv = Papa.unparse([responseHeaders], { header: false, skipEmptyLines: true });
    const configObject = parsePathValueSheet(normalizedRows);

    return {
        title: formTitle,
        rows: normalizedRows,
        csv,
        configObject,
        responseHeaders,
        responseHeaderCsv
    };
}
