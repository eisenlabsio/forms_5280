import logger from '../utils/logger'; // Import the logger

// Function to collect metadata
async function collectMetadata() {
    const metadata = {
        userAgent: navigator.userAgent,
        Timestamp: new Date().toISOString(),
        latitude: null,
        longitude: null,
        accuracy: null,
        locationStatus: 'denied_or_unavailable' // Default status
    };

    if ("geolocation" in navigator) {
        await new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    metadata.latitude = position.coords.latitude;
                    metadata.longitude = position.coords.longitude;
                    metadata.accuracy = position.coords.accuracy;
                    metadata.locationStatus = 'granted';
                    resolve();
                },
                (error) => {
                    logger.warn('Geolocation error:', error.message);
                    if (error.code === error.PERMISSION_DENIED) {
                        metadata.locationStatus = 'denied';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        metadata.locationStatus = 'unavailable';
                    } else if (error.code === error.TIMEOUT) {
                        metadata.locationStatus = 'timeout';
                    }
                    resolve();
                },
                {
                    enableHighAccuracy: false, // For privacy, usually better to keep this false unless critical
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    } else {
        logger.warn('Geolocation not supported by this browser.');
        metadata.locationStatus = 'not_supported';
    }

    return metadata;
}

// Function to submit quiz answers to GAS Web App
async function submitQuiz(individualQuizSheetId, responseSheetId, quizAnswers) {
    const gasWebAppLink = process.env.REACT_APP_GAS_WEB_APP_URL;

    if (!gasWebAppLink || gasWebAppLink === 'YOUR_GAS_WEB_APP_URL_HERE') {
        logger.error('GAS Web App URL is not configured. Please set REACT_APP_GAS_WEB_APP_URL in your .env file.');
        throw new Error('כתובת ה־GAS לא מוגדרת. יש להגדיר REACT_APP_GAS_WEB_APP_URL בקובץ .env.');
    }

    const metadata = await collectMetadata();

    const payload = {
        quizSheetId: individualQuizSheetId,
        responseSheetId: responseSheetId,
        userAnswers: quizAnswers,
        metadata: metadata
    };

    logger.log('Sending quiz submission payload:', payload);

    try {
        const response = await fetch(gasWebAppLink, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        logger.log('Quiz submission response:', result); // This logs to frontend console
        console.log('GAS Web App Raw Response:', result); // Add this for test output
        return result;
    } catch (error) {
        logger.error('Error submitting quiz:', error);
        throw new Error('שגיאת רשת במהלך שליחת הטופס.');
    }
}

export { submitQuiz };
