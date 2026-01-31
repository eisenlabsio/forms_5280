import React, { useState } from 'react';
import { parseGoogleFormHtmlToConfig } from '../services/googleFormParser';

function FormParserTool() {
    const [htmlInput, setHtmlInput] = useState('');
    const [personalInfoCount, setPersonalInfoCount] = useState(3);
    const [personalInfoTitle, setPersonalInfoTitle] = useState('פרטים אישיים');
    const [responseSheetId, setResponseSheetId] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const buildSafeFilename = (title, suffix) => {
        const safe = (title || 'quiz')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
        const base = safe || 'quiz';
        return `${base}_${suffix}.csv`;
    };

    const triggerDownload = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleParse = () => {
        try {
            const parsed = parseGoogleFormHtmlToConfig(htmlInput, {
                personalInfoCount: Number(personalInfoCount) || 0,
                personalInfoPageTitle: personalInfoTitle || 'Personal Info',
                responseSheetId: responseSheetId.trim()
            });
            setResult(parsed);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to parse the HTML.');
            setResult(null);
        }
    };

    return (
        <div className="form-parser-tool">
            <h2>Google Form HTML → Quiz Config</h2>
            <p>Paste the HTML from the form edit page and generate the config.</p>

            <label className="form-parser-label">
                Personal info questions count
                <input
                    type="number"
                    min="0"
                    value={personalInfoCount}
                    onChange={event => setPersonalInfoCount(event.target.value)}
                />
            </label>

            <label className="form-parser-label">
                Personal info page title
                <input
                    type="text"
                    value={personalInfoTitle}
                    onChange={event => setPersonalInfoTitle(event.target.value)}
                />
            </label>

            <label className="form-parser-label">
                Response sheet ID
                <input
                    type="text"
                    value={responseSheetId}
                    onChange={event => setResponseSheetId(event.target.value)}
                    placeholder="Optional Google Sheet ID for responses"
                />
            </label>

            <label className="form-parser-label">
                Form HTML
                <textarea
                    rows="10"
                    value={htmlInput}
                    onChange={event => setHtmlInput(event.target.value)}
                    placeholder="Paste the HTML source from the form edit page here..."
                />
            </label>

            <button type="button" className="submit-button" onClick={handleParse}>Parse</button>

            {error && <div className="error-message">{error}</div>}

            {result && (
                <div className="form-parser-output">
                    <div className="form-parser-actions">
                        <button
                            type="button"
                            className="submit-button"
                            onClick={() => triggerDownload(result.csv, buildSafeFilename(result.title, 'quiz_config'))}
                        >
                            Download Quiz CSV
                        </button>
                        <button
                            type="button"
                            className="submit-button"
                            onClick={() => triggerDownload(result.responseHeaderCsv, buildSafeFilename(result.title, 'responses_header'))}
                        >
                            Download Response Headers CSV
                        </button>
                    </div>

                    <h3>Response Sheet Headers</h3>
                    <pre className="form-parser-pre">{result.responseHeaderCsv}</pre>

                    <h3>JSON Output</h3>
                    <pre className="form-parser-pre">{JSON.stringify(result.configObject, null, 2)}</pre>

                    <h3>CSV Output</h3>
                    <pre className="form-parser-pre">{result.csv}</pre>
                </div>
            )}
        </div>
    );
}

export default FormParserTool;
