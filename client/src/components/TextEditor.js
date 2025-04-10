import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FaImage, FaSmile, FaMicrophone, FaPaintBrush, FaBold, FaItalic, FaUnderline, FaStrikethrough,
        FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaListOl, FaListUl,
        FaQuoteRight, FaClock, FaLink } from 'react-icons/fa';
import { BiLeftIndent, BiRightIndent } from 'react-icons/bi';

const TextEditor = ({ content, setContent, photos, setPhotos, videos, setVideos, audio, setAudio, onSave }) => {
  const [font, setFont] = useState('Roboto');
  const [fontSize, setFontSize] = useState('16');
  const [fontColor, setFontColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [showAudioOptions, setShowAudioOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formatting, setFormatting] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    alignment: 'justifyLeft',
    list: null,
    isBlockquote: false,
  });

  const audioRecorder = useRef(null);
  const fontColorInputRef = useRef(null);
  const highlightColorInputRef = useRef(null);
  const editorRef = useRef(null);

  const emojiList = ['😊', '😂', '😍', '😢', '😡', '👍', '👎', '❤️', '🌟', '🎉',
    '🙌', '🤓', '😎', '🥳', '😴', '🍕', '🌈', '☀️', '🌙', '⭐'];
  const fontList = ['Roboto', 'Arial', 'Times New Roman', 'Courier New', 'Georgia',
    'Verdana', 'Helvetica', 'Comic Sans MS', 'Impact', 'Trebuchet MS'];
  const fontSizes = ['10','12', '14', '16', '18', '20', '24', '28', '32'];

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
    const containers = editorRef.current?.querySelectorAll('.resizable-image-container');
    containers?.forEach(container => {
      const handle = container.querySelector('.resize-handle');
      if (handle && !handle.dataset.listenerAdded) {
        addResizeListener(container, handle);
        handle.dataset.listenerAdded = 'true';
      }
    });
  }, [content]);

  const cleanContent = useCallback((htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const imageContainers = doc.querySelectorAll('.resizable-image-container');
    imageContainers.forEach(container => {
      const img = container.querySelector('img');
      const resizeHandle = container.querySelector('.resize-handle');
      if (img) {
        const newImg = doc.createElement('img');
        newImg.src = img.src;
        newImg.style.width = img.style.width;
        newImg.style.height = img.style.height;
        newImg.style.display = 'block';
        newImg.style.maxWidth = '100%';
        newImg.style.margin = '10px';

        if (resizeHandle) {
          resizeHandle.remove();
        }
        container.parentNode.replaceChild(newImg, container);
      }
    });

    return doc.body.innerHTML;
  }, []);

  const saveCursorPosition = useCallback(() => {
    const selection = window.getSelection();
    return selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
  }, []);

  const restoreCursorPosition = useCallback((range) => {
    if (!range || !editorRef.current) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editorRef.current.focus();
  }, []);

  const applyFormatting = useCallback((command, value = null) => {
    const cursorPosition = saveCursorPosition();
    document.execCommand(command, false, value);
    restoreCursorPosition(cursorPosition);
    updateToolbarFromSelection();
    setContent(editorRef.current.innerHTML);
  }, [setContent]);

  const applyStyleToSelection = useCallback((styleProperty, value) => {
    const selection = window.getSelection();
    const cursorPosition = saveCursorPosition();

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const span = document.createElement('span');
        span.style[styleProperty] = value;
        range.surroundContents(span);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    restoreCursorPosition(cursorPosition);
    updateToolbarFromSelection();
    setContent(editorRef.current.innerHTML);
  }, [setContent]);

  const handleFontChange = (newFont) => {
    setFont(newFont);
    applyStyleToSelection('fontFamily', newFont);
  };

  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    applyStyleToSelection('fontSize', `${newSize}px`);
  };

  const handleFontColorChange = (newColor) => {
    setFontColor(newColor);
    applyStyleToSelection('color', newColor);
  };

  const handleHighlightColorChange = (newColor) => {
    setHighlightColor(newColor);
    applyStyleToSelection('backgroundColor', newColor);
  };

  const updateToolbarFromSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection.rangeCount || !editorRef.current.contains(selection.anchorNode)) {
      setFormatting({
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
        alignment: 'justifyLeft',
        list: null,
        isBlockquote: false,
      });
      return;
    }

    const range = selection.getRangeAt(0);
    let node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;

    if (!node || !editorRef.current.contains(node)) return;

    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const isUnderline = document.queryCommandState('underline');
    const isStrikethrough = document.queryCommandState('strikeThrough');

    let alignment = 'justifyLeft';
    let list = null;
    let isBlockquote = false;

    while (node && node !== editorRef.current) {
      const styles = window.getComputedStyle(node);
      const textAlign = styles.textAlign;
      if (textAlign === 'left') alignment = 'justifyLeft';
      else if (textAlign === 'center') alignment = 'justifyCenter';
      else if (textAlign === 'right') alignment = 'justifyRight';
      else if (textAlign === 'justify') alignment = 'justifyFull';

      if (node.tagName === 'OL') list = 'insertOrderedList';
      else if (node.tagName === 'UL') list = 'insertUnorderedList';
      if (node.tagName === 'BLOCKQUOTE') isBlockquote = true;

      const fontFamily = styles.fontFamily.replace(/['"]/g, '');
      if (fontList.includes(fontFamily)) setFont(fontFamily);
      const fontSizePx = parseInt(styles.fontSize, 10).toString();
      if (fontSizes.includes(fontSizePx)) setFontSize(fontSizePx);
      const color = rgbToHex(styles.color);
      if (color) setFontColor(color);
      const bgColor = rgbToHex(styles.backgroundColor);
      if (bgColor) setHighlightColor(bgColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : bgColor);

      node = node.parentElement;
    }

    setFormatting({ isBold, isItalic, isUnderline, isStrikethrough, alignment, list, isBlockquote });
  }, []);

  const rgbToHex = (color) => {
    if (!color || color === 'transparent') return null;
    const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
    if (!match) return null;
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  const addTimestamp = () => {
    const cursorPosition = saveCursorPosition();
    const timestamp = new Date().toLocaleString();
    document.execCommand('insertHTML', false, `<p>[${timestamp}] </p>`);
    restoreCursorPosition(cursorPosition);
    updateToolbarFromSelection();
    setContent(editorRef.current.innerHTML);
  };

  const addLink = () => {
    const cursorPosition = saveCursorPosition();
    const url = prompt('Enter the URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      restoreCursorPosition(cursorPosition);
      updateToolbarFromSelection();
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleEmojiSelect = (emoji) => {
    const cursorPosition = saveCursorPosition();
    document.execCommand('insertText', false, emoji);
    setShowEmojiPicker(false);
    restoreCursorPosition(cursorPosition);
    updateToolbarFromSelection();
    setContent(editorRef.current.innerHTML);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRecorder.current = new MediaRecorder(stream);
      const chunks = [];
      audioRecorder.current.ondataavailable = e => chunks.push(e.data);
      audioRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mpeg' });
        setAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      audioRecorder.current.start();
      setShowAudioOptions(false);
    } catch (err) {
      console.error('Recording error:', err);
      alert('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (audioRecorder.current) {
      audioRecorder.current.stop();
      setShowAudioOptions(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const cursorPosition = saveCursorPosition();

        const imageContainer = document.createElement('div');
        imageContainer.style.position = 'relative';
        imageContainer.style.display = 'inline-block';
        imageContainer.style.margin = '10px';
        imageContainer.className = 'resizable-image-container';

        const img = document.createElement('img');
        img.src = event.target.result;
        img.style.width = '300px';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.maxWidth = '100%';

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.width = '8px';
        resizeHandle.style.height = '8px';
        resizeHandle.style.background = '#000';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.cursor = 'se-resize';

        imageContainer.appendChild(img);
        imageContainer.appendChild(resizeHandle);

        const selection = window.getSelection();
        if (cursorPosition && editorRef.current.contains(cursorPosition.startContainer)) {
          const range = document.createRange();
          range.setStart(cursorPosition.startContainer, cursorPosition.startOffset);
          range.insertNode(imageContainer);
          range.setStartAfter(imageContainer);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorRef.current.appendChild(imageContainer);
        }

        addResizeListener(imageContainer, resizeHandle);
        setContent(editorRef.current.innerHTML);
      };
      reader.readAsDataURL(file);
    });
  };

  const addResizeListener = (container, handle) => {
    handle.addEventListener('mousedown', (e) => startResize(e, container));
  };

  const startResize = (e, container) => {
    e.preventDefault();
    const img = container.querySelector('img');

    const startX = e.pageX;
    const startY = e.pageY;
    const startWidth = parseInt(window.getComputedStyle(img).width);
    const startHeight = parseInt(window.getComputedStyle(img).height);
    const aspectRatio = startWidth / startHeight;

    const doResize = (e) => {
      const diffX = e.pageX - startX;
      let newWidth = Math.max(50, startWidth + diffX);
      let newHeight = newWidth / aspectRatio;

      img.style.width = `${newWidth}px`;
      img.style.height = `${newHeight}px`;
    };

    const stopResizeLocal = () => {
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResizeLocal);
      setContent(editorRef.current.innerHTML);
    };

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResizeLocal);
  };

  const handleSave = useCallback(() => {
    if (onSave) {
      const cleanedContent = cleanContent(editorRef.current.innerHTML);
      onSave(cleanedContent);
    }
  }, [onSave, cleanContent]);

  const handleBlur = useCallback(() => {
    setContent(editorRef.current.innerHTML);
  }, [setContent]);

  const applyCurrentStyleToNewText = useCallback(() => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        const span = document.createElement('span');
        span.style.fontFamily = font;
        span.style.fontSize = `${fontSize}px`;
        span.style.color = fontColor;
        span.style.backgroundColor = highlightColor;
        range.insertNode(span);
        range.selectNodeContents(span);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [font, fontSize, fontColor, highlightColor]);

  const AudioOptions = () => (
    <div className="audio-options-dropdown">
      <button type="button" onClick={startRecording}>Start Recording</button>
      <button type="button" onClick={stopRecording}>Stop Recording</button>
      <input
        type="file"
        accept="audio/*"
        onChange={e => { setAudio(e.target.files[0]); setShowAudioOptions(false); }}
        style={{ display: 'none' }}
        id="add-audio"
      />
      <label htmlFor="add-audio">Upload Audio</label>
    </div>
  );

  const EmojiPicker = () => (
    <div className="emoji-picker">
      {emojiList.map((emoji, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleEmojiSelect(emoji)}
          className="emoji-button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  return (
    <div className="editor-container">
      <div
        ref={editorRef}
        contentEditable={true}
        onBlur={handleBlur}
        onBeforeInput={applyCurrentStyleToNewText}
        onClick={updateToolbarFromSelection}
        onKeyUp={updateToolbarFromSelection}
        className="editor-textarea"
        placeholder="Write more here..."
      />
      <div className="editor-toolbar">
        <div className="text-formatting-section">
          <select value={font} onChange={e => handleFontChange(e.target.value)} title="Font Family">
            {fontList.map((fontOption, index) => (
              <option key={index} value={fontOption}>{fontOption}</option>
            ))}
          </select>
          <select value={fontSize} onChange={e => handleFontSizeChange(e.target.value)} title="Font Size">
            {fontSizes.map((size, index) => (
              <option key={index} value={size}>{size}px</option>
            ))}
          </select>
          <div className="color-picker-container">
            <button type="button" onClick={() => fontColorInputRef.current.click()} title="Font Color">
              <FaPaintBrush />
            </button>
            <input
              type="color"
              ref={fontColorInputRef}
              value={fontColor}
              onChange={e => handleFontColorChange(e.target.value)}
              className="hidden-color-input"
            />
          </div>
          <div className="color-picker-container">
            <button type="button" onClick={() => highlightColorInputRef.current.click()} title="Highlight Color">
              <FaPaintBrush />
            </button>
            <input
              type="color"
              ref={highlightColorInputRef}
              value={highlightColor}
              onChange={e => handleHighlightColorChange(e.target.value)}
              className="hidden-color-input"
            />
          </div>
        </div>
        <div className="toolbar-separator" />
        <div className="text-formatting-section">
          <button type="button" onClick={() => applyFormatting('bold')} title="Bold" className={formatting.isBold ? 'active' : ''}>
            <FaBold />
          </button>
          <button type="button" onClick={() => applyFormatting('italic')} title="Italic" className={formatting.isItalic ? 'active' : ''}>
            <FaItalic />
          </button>
          <button type="button" onClick={() => applyFormatting('underline')} title="Underline" className={formatting.isUnderline ? 'active' : ''}>
            <FaUnderline />
          </button>
          <button type="button" onClick={() => applyFormatting('strikeThrough')} title="Strikethrough" className={formatting.isStrikethrough ? 'active' : ''}>
            <FaStrikethrough />
          </button>
        </div>
        <div className="toolbar-separator" />
        <div className="text-formatting-section">
          <button type="button" onClick={() => applyFormatting('justifyLeft')} title="Align Left" className={formatting.alignment === 'justifyLeft' ? 'active' : ''}>
            <FaAlignLeft />
          </button>
          <button type="button" onClick={() => applyFormatting('justifyCenter')} title="Align Center" className={formatting.alignment === 'justifyCenter' ? 'active' : ''}>
            <FaAlignCenter />
          </button>
          <button type="button" onClick={() => applyFormatting('justifyRight')} title="Align Right" className={formatting.alignment === 'justifyRight' ? 'active' : ''}>
            <FaAlignRight />
          </button>
          <button type="button" onClick={() => applyFormatting('justifyFull')} title="Justify" className={formatting.alignment === 'justifyFull' ? 'active' : ''}>
            <FaAlignJustify />
          </button>
        </div>
        <div className="toolbar-separator" />
        <div className="text-formatting-section">
          <button type="button" onClick={() => applyFormatting('insertOrderedList')} title="Numbered List" className={formatting.list === 'insertOrderedList' ? 'active' : ''}>
            <FaListOl />
          </button>
          <button type="button" onClick={() => applyFormatting('insertUnorderedList')} title="Bullet List" className={formatting.list === 'insertUnorderedList' ? 'active' : ''}>
            <FaListUl />
          </button>
          <button type="button" onClick={() => applyFormatting('indent')} title="Increase Indent">
            <BiLeftIndent />
          </button>
          <button type="button" onClick={() => applyFormatting('outdent')} title="Decrease Indent">
            <BiRightIndent />
          </button>
        </div>
        <div className="toolbar-separator" />
        <div className="text-formatting-section">
          <button type="button" onClick={() => applyFormatting('formatBlock', 'blockquote')} title="Block Quote" className={formatting.isBlockquote ? 'active' : ''}>
            <FaQuoteRight />
          </button>
          <button type="button" onClick={addTimestamp} title="Add Timestamp">
            <FaClock />
          </button>
          <button type="button" onClick={addLink} title="Add Link">
            <FaLink />
          </button>
        </div>
        <div className="toolbar-separator" />
        <div className="media-section">
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="add-images" />
          <label htmlFor="add-images" className="toolbar-btn" title="Add Images">
            <FaImage />
          </label>
          <div className="emoji-container">
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add Emoji">
              <FaSmile />
            </button>
            {showEmojiPicker && <EmojiPicker />}
          </div>
          <div className="audio-control-container">
            <button type="button" onClick={() => setShowAudioOptions(!showAudioOptions)} title="Audio Options">
              <FaMicrophone />
            </button>
            {showAudioOptions && <AudioOptions />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;