import React, { useRef, useState, useEffect } from 'react';
import './SignatureQuestion.css'; // We'll create this CSS file later
import { useQuiz } from '../context/QuizContext';

const SignatureFormInput = ({ question, onAnswerChange, currentAnswer, localError }) => {
  const { contentData } = useQuiz();
  const t = (key, fallback) => contentData[key] || fallback;
  const [modalOpen, setModalOpen] = useState(false);
  const [signatureSvg, setSignatureSvg] = useState(currentAnswer || '');
  const [strokes, setStrokes] = useState([]);
  const canvasRef = useRef(null);
  const canvasSizeRef = useRef({ cssWidth: 400, cssHeight: 200 });
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);

  useEffect(() => {
    // This effect ensures that if the currentAnswer changes from outside,
    // the signatureSvg state is updated. This might happen if the user navigates
    // back and forth between questions.
    setSignatureSvg(currentAnswer || '');
  }, [currentAnswer]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvasSizeRef.current = { cssWidth: rect.width, cssHeight: rect.height };
    canvas.width = Math.max(1, Math.floor(rect.width * scale));
    canvas.height = Math.max(1, Math.floor(rect.height * scale));
  };

  const openModal = () => {
    setModalOpen(true);
    setStrokes([]);
    // Request animation frame to ensure canvas is rendered before getting context
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        resizeCanvas();
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas on open
        // If there's a current signature, attempt to redraw it or indicate presence
        if (signatureSvg) {
          // For simplicity in initial implementation, we won't redraw complex SVG.
          // A real implementation might use a library to render SVG back onto canvas.
          // For now, if signatureSvg exists, we just acknowledge it.
          // A more robust solution for redrawing SVG on canvas would be complex
          // and likely require an external library or a custom SVG parser/renderer.
        }
      }
    });
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const getCanvasPoint = (event, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (source.clientX - rect.left) * scaleX,
      y: (source.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const startPoint = getCanvasPoint(e, canvas);
    lastPoint.current = startPoint;
    setStrokes(prevStrokes => [...prevStrokes, [startPoint]]);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPoint = getCanvasPoint(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    lastPoint.current = currentPoint;
    setStrokes(prevStrokes => {
      if (prevStrokes.length === 0) {
        return [[currentPoint]];
      }
      const nextStrokes = [...prevStrokes];
      const currentStroke = nextStrokes[nextStrokes.length - 1];
      nextStrokes[nextStrokes.length - 1] = [...currentStroke, currentPoint];
      return nextStrokes;
    });
  };

  const endDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSvg(''); // Clear saved SVG
    setStrokes([]);
  };

  const buildSvgFromStrokes = (paths, width, height, viewBoxWidth, viewBoxHeight) => {
    if (!paths.length) {
      return '';
    }
    const pathElements = paths
      .filter(stroke => stroke.length > 0)
      .map(stroke => {
        const [first, ...rest] = stroke;
        const segments = rest.map(point => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
        const d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${segments}`.trim();
        return `<path d="${d}" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
      })
      .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">${pathElements}</svg>`;
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const { cssWidth, cssHeight } = canvasSizeRef.current;
    const svg = buildSvgFromStrokes(strokes, cssWidth, cssHeight, canvas.width, canvas.height);
    setSignatureSvg(svg);
    onAnswerChange(question.id, svg);
    closeModal();
  };

  return (
    <div className="signature-question-container">
      <p className="question-text">{question.text}</p>
      {signatureSvg ? (
        <div className="signature-preview">
          <p>{t('signature_saved', 'חתימה נשמרה:')}</p>
          {signatureSvg.startsWith('data:image/png') ? (
            <img src={signatureSvg} alt={t('signature_preview_alt', 'תצוגת חתימה')} className="signature-img-preview" />
          ) : (
            // If it's an SVG string, render it directly (for future SVG conversion)
            <div dangerouslySetInnerHTML={{ __html: signatureSvg }} className="signature-svg-preview" />
          )}
          <button onClick={openModal} className="edit-signature-button">{t('signature_edit', 'עריכת חתימה')}</button>
        </div>
      ) : (
        <button onClick={openModal} className="add-signature-button">{t('signature_add', 'הוספת חתימה')}</button>
      )}
      {localError && <div className="error-message" style={{ color: 'red' }}>{localError}</div>} {/* Display error */}

      {modalOpen && (
        <div className="signature-modal-overlay">
          <div className="signature-modal-content">
            <h3>{t('signature_draw_title', 'חתום כאן')}</h3>
            <canvas
              ref={canvasRef}
              width={400} // Fixed width for modal canvas
              height={200} // Fixed height for modal canvas
              className="signature-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseOut={endDrawing} // End drawing if mouse leaves canvas
              onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
              onTouchMove={(e) => { e.preventDefault(); draw(e); }}
              onTouchEnd={(e) => { e.preventDefault(); endDrawing(e); }}
              onTouchCancel={(e) => { e.preventDefault(); endDrawing(e); }}
            ></canvas>
            <div className="modal-actions">
              <button onClick={clearCanvas} className="clear-button">{t('clear_button', 'נקה')}</button>
              <button onClick={saveSignature} className="save-button">{t('save_button', 'שמור')}</button>
              <button onClick={closeModal} className="cancel-button">{t('cancel_button', 'ביטול')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureFormInput;
