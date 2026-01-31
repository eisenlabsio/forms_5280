import React from 'react';

function DisplayHtmlFormInput({ element }) {
    if (!element?.html) {
        return null;
    }

    return (
        <div className="display-html" dangerouslySetInnerHTML={{ __html: element.html }} />
    );
}

export default DisplayHtmlFormInput;
