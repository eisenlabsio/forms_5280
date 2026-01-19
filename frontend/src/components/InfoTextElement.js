import React from 'react';

function InfoTextElement({ element }) {
    return (
        <p className="info-text">{element.value}</p>
    );
}

export default InfoTextElement;
