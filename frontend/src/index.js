import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css'; // Using App.css now
import App from './App';
import reportWebVitals from './reportWebVitals';
import { QuizProvider } from './context/QuizContext'; // Import QuizProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QuizProvider> {/* Wrap App with QuizProvider */}
      <App />
    </QuizProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
