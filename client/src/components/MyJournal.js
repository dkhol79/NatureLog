import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { FaImage, FaSmile, FaMicrophone, FaPaintBrush, FaBold, FaItalic, FaUnderline, FaStrikethrough,
        FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaListOl, FaListUl,
        FaQuoteRight, FaClock, FaLink } from 'react-icons/fa';
import { BiLeftIndent, BiRightIndent } from 'react-icons/bi';

const MyJournal = ({ token, handleLogout }) => {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Wildlife');
  const [location, setLocation] = useState('');
  const [locationData, setLocationData] = useState({ lat: '', lng: '', address: '' });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  const [isPublic, setIsPublic] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [audio, setAudio] = useState(null);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [font, setFont] = useState('Roboto');
  const [fontSize, setFontSize] = useState('16');
  const [fontColor, setFontColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [showAudioOptions, setShowAudioOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  // New state for formatting
  const [formatting, setFormatting] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    alignment: 'justifyLeft',
    list: null,
    isBlockquote: false,
  });
  const history = useHistory();
  const audioRecorder = useRef(null);
  const fontColorInputRef = useRef(null);
  const highlightColorInputRef = useRef(null);
  const editorRef = useRef(null);

  const categories = [
    'Wildlife', 'Plants', 'Scenic Views', 'Weather', 'Birds', 'Geology', 'Water Bodies',
  ];

  const emojiList = [
    '😊', '😂', '😍', '😢', '😡', '👍', '👎', '❤️', '🌟', '🎉',
    '🙌', '🤓', '😎', '🥳', '😴', '🍕', '🌈', '☀️', '🌙', '⭐'
  ];

  const fontList = [
    'Roboto', 'Arial', 'Times New Roman', 'Courier New', 'Georgia',
    'Verdana', 'Helvetica', 'Comic Sans MS', 'Impact', 'Trebuchet MS'
  ];

  const fontSizes = ['12', '14', '16', '18', '20', '24', '28', '32'];

  useEffect(() => {
    if (!token) window.location.href = '/login';

    if (history.location.state?.entryToEdit) {
      handleEdit(history.location.state.entryToEdit);
      history.replace({ ...history.location, state: undefined });
    }

    const fetchLocation = async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const address = response.data.display_name;
        setLocation(address);
        setLocationData({
          lat: latitude.toString(),
          lng: longitude.toString(),
          address: address
        });
        setIsLocationDenied(false);
      } catch (err) {
        console.error('Geocoding error:', err);
        setLocation('Location not available');
      }
    };

    navigator.geolocation.getCurrentPosition(
      fetchLocation,
      (err) => {
        console.error('Geolocation error:', err);
        setLocation('Location access denied');
        setIsLocationDenied(true);
      },
      { enableHighAccuracy: true }
    );

    axios
      .get('http://localhost:5000/api/journal', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setEntries(res.data));
  }, [token, history]);

  const handleLocationChange = async (e) => {
    const newLocation = e.target.value;
    setLocation(newLocation);

    if (newLocation.length > 2) {
      try {
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocation)}`;
        if (userCoords.lat && userCoords.lng) {
          url += `&lat=${userCoords.lat}&lon=${userCoords.lng}`;
        }
        const response = await axios.get(url);
        setLocationSuggestions(response.data.slice(0, 5));
      } catch (err) {
        console.error('Location search error:', err);
        setLocationSuggestions([]);
      }
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    const selectedLocation = suggestion.display_name;
    setLocation(selectedLocation);
    setLocationData({
      lat: suggestion.lat,
      lng: suggestion.lon,
      address: selectedLocation
    });
    setLocationSuggestions([]);
  };

  const handleAllowLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const address = response.data.display_name;
          setLocation(address);
          setLocationData({
            lat: latitude.toString(),
            lng: longitude.toString(),
            address: address
          });
          setIsLocationDenied(false);
        } catch (err) {
          console.error('Geocoding error:', err);
          setLocation('Location not available');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Please enable location access in your browser settings');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setLocation(entry.location);
    setLocationData({
      lat: entry.geolocation.lat.toString(),
      lng: entry.geolocation.lng.toString(),
      address: entry.location
    });
    setIsPublic(entry.isPublic);
    setDate(entry.date);
    setFont('Roboto');
    setFontSize('16');
    setFontColor('#000000');
    setHighlightColor('transparent');
    if (editorRef.current) {
      editorRef.current.innerHTML = entry.content;
      updateToolbarFromSelection(); // Initial update when loading entry
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.length < 3) return alert('Title must be at least 3 characters');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', editorRef.current.innerHTML);
    formData.append('category', category);
    formData.append('lat', locationData.lat);
    formData.append('lng', locationData.lng);
    formData.append('location', location);
    formData.append('isPublic', isPublic);
    formData.append('date', date);
    photos.forEach(photo => formData.append('photos', photo));
    videos.forEach(video => formData.append('videos', video));
    if (audio) formData.append('audio', audio);

    try {
      let res;
      if (editingEntry) {
        res = await axios.put(`http://localhost:5000/api/journal/${editingEntry.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setEntries(entries.map(entry =>
          entry.id === editingEntry.id ? res.data : entry
        ));
        setEditingEntry(null);
      } else {
        res = await axios.post('http://localhost:5000/api/journal', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setEntries([...entries, res.data]);
      }

      setTitle('');
      setContent('');
      editorRef.current.innerHTML = '';
      setIsPublic(false);
      setPhotos([]);
      setVideos([]);
      setAudio(null);
      setDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      setFont('Roboto');
      setFontSize('16');
      setFontColor('#000000');
      setHighlightColor('transparent');
      setLocation('');
      setLocationData({ lat: '', lng: '', address: '' });
      setFormatting({
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
        alignment: 'justifyLeft',
        list: null,
        isBlockquote: false,
      });
    } catch (err) {
      console.error('Error submitting entry:', err);
      alert(`Failed to ${editingEntry ? 'update' : 'add'} entry`);
    }
  };

  const handleCardClick = (id) => {
    history.push(`/entry/${id}`);
  };

  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
    }
    return null;
  };

  const restoreCursorPosition = (position) => {
    if (!position || !editorRef.current) return;

    const selection = window.getSelection();
    const range = document.createRange();

    try {
      if (editorRef.current.contains(position.startContainer)) {
        const startLength = position.startContainer.nodeType === Node.TEXT_NODE
          ? position.startContainer.length
          : position.startContainer.childNodes.length;
        const adjustedStartOffset = Math.min(position.startOffset, startLength);
        range.setStart(position.startContainer, adjustedStartOffset);
      } else {
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }

      if (editorRef.current.contains(position.endContainer)) {
        const endLength = position.endContainer.nodeType === Node.TEXT_NODE
          ? position.endContainer.length
          : position.endContainer.childNodes.length;
        const adjustedEndOffset = Math.min(position.endOffset, endLength);
        range.setEnd(position.endContainer, adjustedEndOffset);
      } else {
        range.collapse(true);
      }

      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {
      console.warn('Failed to restore cursor position:', e);
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const applyFormatting = (command, value = null) => {
    const cursorPosition = saveCursorPosition();
    document.execCommand(command, false, value);
    setContent(editorRef.current.innerHTML);
    requestAnimationFrame(() => {
      restoreCursorPosition(cursorPosition);
      updateToolbarFromSelection(); // Update toolbar after applying formatting
    });
  };

  const applyStyleToSelection = (styleProperty, value) => {
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

    setContent(editorRef.current.innerHTML);
    requestAnimationFrame(() => {
      restoreCursorPosition(cursorPosition);
      updateToolbarFromSelection(); // Update toolbar after applying style
    });
  };

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

  const updateToolbarFromSelection = () => {
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
    let node = range.commonAncestorContainer;

    // Ensure we get an element
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentElement;
    }

    // If no valid element, reset to defaults
    if (!node || !editorRef.current.contains(node)) {
      setFont('Roboto');
      setFontSize('16');
      setFontColor('#000000');
      setHighlightColor('transparent');
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

    // Inline formatting
    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const isUnderline = document.queryCommandState('underline');
    const isStrikethrough = document.queryCommandState('strikeThrough');

    // Alignment
    let alignment = 'justifyLeft';
    let currentNode = node;
    while (currentNode && currentNode !== editorRef.current && currentNode.nodeType === Node.ELEMENT_NODE) {
      const styles = window.getComputedStyle(currentNode);
      const textAlign = styles.textAlign;
      if (textAlign === 'left') alignment = 'justifyLeft';
      else if (textAlign === 'center') alignment = 'justifyCenter';
      else if (textAlign === 'right') alignment = 'justifyRight';
      else if (textAlign === 'justify') alignment = 'justifyFull';
      currentNode = currentNode.parentElement;
    }

    // List
    let list = null;
    currentNode = node;
    while (currentNode && currentNode !== editorRef.current && currentNode.nodeType === Node.ELEMENT_NODE) {
      if (currentNode.tagName === 'OL') list = 'insertOrderedList';
      else if (currentNode.tagName === 'UL') list = 'insertUnorderedList';
      currentNode = currentNode.parentElement;
    }

    // Blockquote
    let isBlockquote = false;
    currentNode = node;
    while (currentNode && currentNode !== editorRef.current && currentNode.nodeType === Node.ELEMENT_NODE) {
      if (currentNode.tagName === 'BLOCKQUOTE') isBlockquote = true;
      currentNode = currentNode.parentElement;
    }

    // Styles
    while (node && node !== editorRef.current && node.nodeType === Node.ELEMENT_NODE) {
      const styles = window.getComputedStyle(node);
      const currentFont = styles.fontFamily.replace(/['"]/g, '');
      if (fontList.includes(currentFont)) setFont(currentFont);
      const currentSize = parseInt(styles.fontSize, 10).toString();
      if (fontSizes.includes(currentSize)) setFontSize(currentSize);
      const currentColor = rgbToHex(styles.color);
      if (currentColor) setFontColor(currentColor);
      const currentHighlight = rgbToHex(styles.backgroundColor);
      if (currentHighlight) setHighlightColor(currentHighlight === 'rgba(0, 0, 0, 0)' ? 'transparent' : currentHighlight);
      node = node.parentElement;
    }

    setFormatting({
      isBold,
      isItalic,
      isUnderline,
      isStrikethrough,
      alignment,
      list,
      isBlockquote,
    });
  };

  // Convert RGB/RGBA to Hex
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
    setContent(editorRef.current.innerHTML);
    requestAnimationFrame(() => {
      restoreCursorPosition(cursorPosition);
      updateToolbarFromSelection();
    });
  };

  const addLink = () => {
    const cursorPosition = saveCursorPosition();
    const url = prompt('Enter the URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      setContent(editorRef.current.innerHTML);
      requestAnimationFrame(() => {
        restoreCursorPosition(cursorPosition);
        updateToolbarFromSelection();
      });
    }
  };

  const handleEmojiSelect = (emoji) => {
    const cursorPosition = saveCursorPosition();
    document.execCommand('insertText', false, emoji);
    setContent(editorRef.current.innerHTML);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      restoreCursorPosition(cursorPosition);
      updateToolbarFromSelection();
    });
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

  const handleContentChange = (e) => {
    setContent(editorRef.current.innerHTML);
  };

  const applyCurrentStyleToNewText = (e) => {
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
        range.setStart(span, 0);
        range.setEnd(span, 0);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const AudioOptions = () => (
    <div className="audio-options-dropdown">
      <button type="button" onClick={startRecording}>Start Recording</button>
      <button type="button" onClick={stopRecording}>Stop Recording</button>
      <input
        type="file"
        accept="audio/*"
        onChange={e => {
          setAudio(e.target.files[0]);
          setShowAudioOptions(false);
        }}
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
    <div className="app-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="sidebar-btn" onClick={() => history.push('/journal')}>
            My Journal
          </button>
          <button className="sidebar-btn" onClick={() => history.push('/')}>
            Community Feed
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </nav>
        <div className="sidebar-entries">
          <h3>Entries</h3>
          {entries.map(entry => (
            <div
              key={entry.id}
              className="sidebar-entry"
              onClick={() => handleCardClick(entry.id)}
            >
              <p className="entry-date">{entry.date}</p>
              <h4>{entry.title}</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(entry);
                }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </aside>
      <main className="main-content">
        <div className="journal-container">
          <h2>My Journal</h2>
          <form onSubmit={handleSubmit} className="journal-form">
            <input
              type="text"
              value={date}
              onChange={e => setDate(e.target.value)}
              placeholder="Date (e.g., 5 April 2025)"
              required
            />
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
            <div className="editor-container">
              <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleContentChange}
                onBeforeInput={applyCurrentStyleToNewText}
                onClick={updateToolbarFromSelection}
                onKeyUp={updateToolbarFromSelection}
                className="editor-textarea"
              />
              <div className="editor-toolbar">
                <div className="text-formatting-section">
                  <select
                    value={font}
                    onChange={e => handleFontChange(e.target.value)}
                    title="Font Family"
                  >
                    {fontList.map((fontOption, index) => (
                      <option key={index} value={fontOption}>{fontOption}</option>
                    ))}
                  </select>
                  <select
                    value={fontSize}
                    onChange={e => handleFontSizeChange(e.target.value)}
                    title="Font Size"
                  >
                    {fontSizes.map((size, index) => (
                      <option key={index} value={size}>{size}px</option>
                    ))}
                  </select>
                  <div className="color-picker-container">
                    <button
                      type="button"
                      onClick={() => fontColorInputRef.current.click()}
                      title="Font Color"
                    >
                      <FaPaintBrush />
                    </button>
                    <input
                      type="color"
                      ref={fontColorInputRef}
                      value={fontColor}
                      onChange={(e) => handleFontColorChange(e.target.value)}
                      className="hidden-color-input"
                    />
                  </div>
                  <div className="color-picker-container">
                    <button
                      type="button"
                      onClick={() => highlightColorInputRef.current.click()}
                      title="Highlight Color"
                    >
                      <FaPaintBrush />
                    </button>
                    <input
                      type="color"
                      ref={highlightColorInputRef}
                      value={highlightColor}
                      onChange={(e) => handleHighlightColorChange(e.target.value)}
                      className="hidden-color-input"
                    />
                  </div>
                </div>
                <div className="toolbar-separator" />
                <div className="text-formatting-section">
                  <button
                    type="button"
                    onClick={() => applyFormatting('bold')}
                    title="Bold"
                    className={formatting.isBold ? 'active' : ''}
                  >
                    <FaBold />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('italic')}
                    title="Italic"
                    className={formatting.isItalic ? 'active' : ''}
                  >
                    <FaItalic />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('underline')}
                    title="Underline"
                    className={formatting.isUnderline ? 'active' : ''}
                  >
                    <FaUnderline />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('strikeThrough')}
                    title="Strikethrough"
                    className={formatting.isStrikethrough ? 'active' : ''}
                  >
                    <FaStrikethrough />
                  </button>
                </div>
                <div className="toolbar-separator" />
                <div className="text-formatting-section">
                  <button
                    type="button"
                    onClick={() => applyFormatting('justifyLeft')}
                    title="Align Left"
                    className={formatting.alignment === 'justifyLeft' ? 'active' : ''}
                  >
                    <FaAlignLeft />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('justifyCenter')}
                    title="Align Center"
                    className={formatting.alignment === 'justifyCenter' ? 'active' : ''}
                  >
                    <FaAlignCenter />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('justifyRight')}
                    title="Align Right"
                    className={formatting.alignment === 'justifyRight' ? 'active' : ''}
                  >
                    <FaAlignRight />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('justifyFull')}
                    title="Justify"
                    className={formatting.alignment === 'justifyFull' ? 'active' : ''}
                  >
                    <FaAlignJustify />
                  </button>
                </div>
                <div className="toolbar-separator" />
                <div className="text-formatting-section">
                  <button
                    type="button"
                    onClick={() => applyFormatting('insertOrderedList')}
                    title="Numbered List"
                    className={formatting.list === 'insertOrderedList' ? 'active' : ''}
                  >
                    <FaListOl />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('insertUnorderedList')}
                    title="Bullet List"
                    className={formatting.list === 'insertUnorderedList' ? 'active' : ''}
                  >
                    <FaListUl />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('indent')}
                    title="Increase Indent"
                  >
                    <BiLeftIndent />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('outdent')}
                    title="Decrease Indent"
                  >
                    <BiRightIndent />
                  </button>
                </div>
                <div className="toolbar-separator" />
                <div className="text-formatting-section">
                  <button
                    type="button"
                    onClick={() => applyFormatting('formatBlock', 'blockquote')}
                    title="Block Quote"
                    className={formatting.isBlockquote ? 'active' : ''}
                  >
                    <FaQuoteRight />
                  </button>
                  <button
                    type="button"
                    onClick={addTimestamp}
                    title="Add Timestamp"
                  >
                    <FaClock />
                  </button>
                  <button
                    type="button"
                    onClick={addLink}
                    title="Add Link"
                  >
                    <FaLink />
                  </button>
                </div>
                <div className="toolbar-separator" />
                <div className="media-section">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => setPhotos([...e.target.files])}
                    style={{ display: 'none' }}
                    id="add-images"
                  />
                  <label htmlFor="add-images" className="toolbar-btn" title="Add Images">
                    <FaImage />
                  </label>
                  <div className="emoji-container">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Add Emoji"
                    >
                      <FaSmile />
                    </button>
                    {showEmojiPicker && <EmojiPicker />}
                  </div>
                  <div className="audio-control-container">
                    <button
                      type="button"
                      onClick={() => setShowAudioOptions(!showAudioOptions)}
                      title="Audio Options"
                    >
                      <FaMicrophone />
                    </button>
                    {showAudioOptions && <AudioOptions />}
                  </div>
                </div>
              </div>
            </div>
            <div className="location-container">
              <input
                type="text"
                value={location}
                onChange={handleLocationChange}
                placeholder="Location (auto-detected or enter manually)"
                required
                autoComplete="off"
              />
              {isLocationDenied && (
                <button
                  type="button"
                  onClick={handleAllowLocation}
                  className="allow-location-btn"
                >
                  Allow Location
                </button>
              )}
              {locationSuggestions.length > 0 && (
                <ul className="location-suggestions">
                  {locationSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      {suggestion.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
              Make this entry public
            </label>
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={e => setVideos([...e.target.files])}
            />
            <button type="submit">{editingEntry ? 'Update Entry' : 'Add Entry'}</button>
            {editingEntry && (
              <button type="button" onClick={() => setEditingEntry(null)}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default MyJournal;