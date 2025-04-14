import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaImage, FaSmile, FaMicrophone, FaPaintBrush, FaBold, FaItalic, FaUnderline, FaStrikethrough,
         FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaListOl, FaListUl,
         FaQuoteRight, FaClock, FaLink, FaMinus, FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
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
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [audioOptionsPosition, setAudioOptionsPosition] = useState({ top: 0, left: 0 });

  // State for custom audio player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRecorder = useRef(null);
  const fontColorInputRef = useRef(null);
  const highlightColorInputRef = useRef(null);
  const editorRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const audioButtonRef = useRef(null);
  const audioElementRef = useRef(null);

  const emojiList = ['😊', '😂', '😍', '😢', '😡', '👍', '👎', '❤️', '🌟', '🎉',
    '🙌', '🤓', '😎', '🥳', '😴', '🍕', '🌈', '☀️', '🌙', '⭐'];
  const fontList = ['Roboto', 'Arial', 'Times New Roman', 'Courier New', 'Georgia',
    'Verdana', 'Helvetica', 'Comic Sans MS', 'Impact', 'Trebuchet MS'];
  const fontSizes = ['10', '12', '14', '16', '18', '20', '24', '28', '32'];

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

    const captions = editorRef.current?.querySelectorAll('.image-caption');
    captions?.forEach(caption => {
      if (!caption.dataset.listenerAdded) {
        caption.addEventListener('blur', handleCaptionBlur);
        caption.dataset.listenerAdded = 'true';
      }
    });

    // Reattach event listeners to audio elements
    const audioElements = editorRef.current?.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audioElementRef.current = audio; // Set the ref to the current audio element
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      setVolume(audio.volume);
      setIsMuted(audio.volume === 0);
    });

    // Reattach event listeners to custom controls
    const customControls = editorRef.current?.querySelectorAll('.custom-audio-controls');
    customControls.forEach(controls => {
      const playPauseBtn = controls.querySelector('.play-pause-btn');
      const timeline = controls.querySelector('.timeline');
      const muteBtn = controls.querySelector('.mute-btn');
      const volumeSlider = controls.querySelector('.volume-slider');

      // Remove existing listeners to prevent duplicates
      playPauseBtn.removeEventListener('click', togglePlayPause);
      timeline.removeEventListener('input', handleTimelineChange);
      muteBtn.removeEventListener('click', toggleMute);
      volumeSlider.removeEventListener('input', handleVolumeChange);

      // Add new listeners
      playPauseBtn.addEventListener('click', togglePlayPause);
      timeline.addEventListener('input', handleTimelineChange);
      muteBtn.addEventListener('click', toggleMute);
      volumeSlider.addEventListener('input', handleVolumeChange);
    });
  }, [content, isPlaying, currentTime, duration, volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioElementRef.current) {
      setCurrentTime(audioElementRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioElementRef.current) {
      setDuration(audioElementRef.current.duration);
      setCurrentTime(0); // Reset current time when new audio is loaded
      setIsPlaying(false); // Ensure play state is reset
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlayPause = () => {
    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play().catch(err => {
          console.error('Playback error:', err);
          alert('Failed to play audio. Please try again.');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimelineChange = (e) => {
    if (audioElementRef.current) {
      const newTime = (e.target.value / 100) * duration;
      audioElementRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    if (audioElementRef.current) {
      const newVolume = parseFloat(e.target.value);
      audioElementRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioElementRef.current) {
      if (isMuted) {
        audioElementRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioElementRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const cleanContent = useCallback((htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Clean images
    const imageContainers = doc.querySelectorAll('.resizable-image-container');
    imageContainers.forEach(container => {
      const img = container.querySelector('img');
      const caption = container.querySelector('.image-caption');
      const resizeHandle = container.querySelector('.resize-handle');
      if (img) {
        const alignmentContainer = doc.createElement('div');
        alignmentContainer.className = 'image-alignment-container';
        const parentAlignment = container.parentElement.style.textAlign || 'left';
        alignmentContainer.style.textAlign = parentAlignment;

        const imageWrapper = doc.createElement('div');
        imageWrapper.className = 'image-wrapper';
        imageWrapper.style.width = img.style.width || '300px';

        const newImg = doc.createElement('img');
        newImg.src = img.src;
        newImg.style.width = '100%';
        newImg.style.height = img.style.height || 'auto';
        newImg.style.display = 'block';
        newImg.style.maxWidth = '100%';

        imageWrapper.appendChild(newImg);

        if (caption && caption.textContent.trim()) {
          const captionDiv = doc.createElement('div');
          captionDiv.className = 'image-caption';
          captionDiv.textContent = caption.textContent;
          alignmentContainer.appendChild(imageWrapper);
          alignmentContainer.appendChild(captionDiv);
        } else {
          alignmentContainer.appendChild(imageWrapper);
        }

        if (resizeHandle) {
          resizeHandle.remove();
        }
        container.parentNode.replaceChild(alignmentContainer, container);
      }
    });

    // Clean audio players
    const audioContainers = doc.querySelectorAll('.audio-alignment-container');
    if (audioContainers.length > 0) {
      const lastAudioContainer = audioContainers[audioContainers.length - 1];
      const audio = lastAudioContainer.querySelector('audio');
      if (audio) {
        const alignmentContainer = doc.createElement('div');
        alignmentContainer.className = 'audio-alignment-container';
        const parentAlignment = lastAudioContainer.parentElement.style.textAlign || 'left';
        alignmentContainer.style.textAlign = parentAlignment;

        const audioWrapper = doc.createElement('div');
        audioWrapper.className = 'audio-wrapper';

        const newAudio = doc.createElement('audio');
        newAudio.src = audio.src;
        newAudio.className = 'audio-player';

        audioWrapper.appendChild(newAudio);

        // Rebuild custom controls without event listeners (they'll be reattached in useEffect)
        const customControls = doc.createElement('div');
        customControls.className = 'custom-audio-controls';
        customControls.innerHTML = `
          <button class="play-pause-btn"></button>
          <span class="current-time">${formatTime(0)}</span>
          <input type="range" class="timeline" min="0" max="100" value="0" />
          <span class="duration">${formatTime(0)}</span>
          <button class="mute-btn"></button>
          <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1" />
        `;

        audioWrapper.appendChild(customControls);
        alignmentContainer.appendChild(audioWrapper);

        lastAudioContainer.parentNode.replaceChild(alignmentContainer, lastAudioContainer);

        audioContainers.forEach((container, index) => {
          if (index !== audioContainers.length - 1) {
            container.remove();
          }
        });
      }
    }

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
    if (command.startsWith('justify')) {
      editorRef.current.style.textAlign = {
        justifyLeft: 'left',
        justifyCenter: 'center',
        justifyRight: 'right',
        justifyFull: 'justify',
      }[command] || 'left';
      const alignmentContainers = editorRef.current.querySelectorAll('.image-alignment-container, .audio-alignment-container');
      alignmentContainers.forEach(container => {
        container.style.textAlign = editorRef.current.style.textAlign;
      });
    } else {
      document.execCommand(command, false, value);
    }
    restoreCursorPosition(cursorPosition);
    updateToolbarFromSelection();
    setContent(editorRef.current.innerHTML);
  }, [setContent]);

  const applyStyleToSelection = useCallback((styleProperty, value) => {
    const selection = window.getSelection();
    const cursorPosition = saveCursorPosition();

    if (!selection.rangeCount || selection.isCollapsed) {
      const span = document.createElement('span');
      span.style[styleProperty] = value;
      const range = cursorPosition || document.createRange();
      range.insertNode(span);
      range.selectNodeContents(span);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      restoreCursorPosition(cursorPosition);
      updateToolbarFromSelection();
      setContent(editorRef.current.innerHTML);
      return;
    }

    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);

    const containsNonText = tempDiv.querySelector('img, audio, video, div');
    if (containsNonText) {
      alert('Cannot apply font styles to images or other media. Please select text only.');
      restoreCursorPosition(cursorPosition);
      return;
    }

    const span = document.createElement('span');
    span.style[styleProperty] = value;

    try {
      range.surroundContents(span);
    } catch (err) {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
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
        alignment: editorRef.current.style.textAlign === 'center' ? 'justifyCenter' :
                   editorRef.current.style.textAlign === 'right' ? 'justifyRight' :
                   editorRef.current.style.textAlign === 'justify' ? 'justifyFull' : 'justifyLeft',
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

    let alignment = editorRef.current.style.textAlign === 'center' ? 'justifyCenter' :
                    editorRef.current.style.textAlign === 'right' ? 'justifyRight' :
                    editorRef.current.style.textAlign === 'justify' ? 'justifyFull' : 'justifyLeft';
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

  const addSeparatorLine = () => {
    const cursorPosition = saveCursorPosition();
    document.execCommand('insertHTML', false, '<hr class="editor-separator-line">');
    restoreCursorPosition(cursorPosition);
    updateToolbarFromSelection();
    setContent(editorRef.current.innerHTML);
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
        insertAudioPlayer(blob);
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

  const insertAudioPlayer = (audioBlob) => {
    const cursorPosition = saveCursorPosition();

    // Remove existing audio elements
    const existingAudioContainers = editorRef.current.querySelectorAll('.audio-alignment-container');
    existingAudioContainers.forEach(container => container.remove());

    if (audio) {
      URL.revokeObjectURL(audio);
    }

    const audioUrl = URL.createObjectURL(audioBlob);

    const alignmentContainer = document.createElement('div');
    alignmentContainer.className = 'audio-alignment-container';
    const editorAlignment = editorRef.current.style.textAlign || 'left';
    alignmentContainer.style.textAlign = editorAlignment;

    const audioWrapper = document.createElement('div');
    audioWrapper.className = 'audio-wrapper';

    const audioElement = document.createElement('audio');
    audioElement.src = audioUrl;
    audioElement.className = 'audio-player';
    audioElementRef.current = audioElement;

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('ended', handleEnded);

    const customControls = document.createElement('div');
    customControls.className = 'custom-audio-controls';

    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'play-pause-btn';
    playPauseBtn.innerHTML = isPlaying ? '<svg><use href="#fa-pause" /></svg>' : '<svg><use href="#fa-play" /></svg>';
    playPauseBtn.addEventListener('click', togglePlayPause);

    const currentTimeSpan = document.createElement('span');
    currentTimeSpan.className = 'current-time';
    currentTimeSpan.textContent = formatTime(currentTime);

    const timeline = document.createElement('input');
    timeline.type = 'range';
    timeline.className = 'timeline';
    timeline.min = '0';
    timeline.max = '100';
    timeline.value = (currentTime / duration) * 100 || 0;
    timeline.addEventListener('input', handleTimelineChange);

    const durationSpan = document.createElement('span');
    durationSpan.className = 'duration';
    durationSpan.textContent = formatTime(duration);

    const muteBtn = document.createElement('button');
    muteBtn.className = 'mute-btn';
    muteBtn.innerHTML = isMuted ? '<svg><use href="#fa-volume-mute" /></svg>' : '<svg><use href="#fa-volume-up" /></svg>';
    muteBtn.addEventListener('click', toggleMute);

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.className = 'volume-slider';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.1';
    volumeSlider.value = volume;
    volumeSlider.addEventListener('input', handleVolumeChange);

    customControls.appendChild(playPauseBtn);
    customControls.appendChild(currentTimeSpan);
    customControls.appendChild(timeline);
    customControls.appendChild(durationSpan);
    customControls.appendChild(muteBtn);
    customControls.appendChild(volumeSlider);

    audioWrapper.appendChild(audioElement);
    audioWrapper.appendChild(customControls);
    alignmentContainer.appendChild(audioWrapper);

    const selection = window.getSelection();
    const range = document.createRange();

    if (cursorPosition && editorRef.current.contains(cursorPosition.startContainer)) {
      range.setStart(cursorPosition.startContainer, cursorPosition.startOffset);
      range.insertNode(alignmentContainer);
      const spacer = document.createTextNode('\u200B');
      range.insertNode(spacer);
      range.setStartAfter(spacer);
      range.setEndAfter(spacer);
    } else {
      editorRef.current.appendChild(alignmentContainer);
      const spacer = document.createTextNode('\u200B');
      editorRef.current.appendChild(spacer);
      range.setStartAfter(spacer);
      range.setEndAfter(spacer);
    }

    selection.removeAllRanges();
    selection.addRange(range);
    editorRef.current.focus();

    setContent(editorRef.current.innerHTML);
    setAudio(audioBlob);

    // Reset audio state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVolume(1);
    setIsMuted(false);
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      insertAudioPlayer(file);
      setShowAudioOptions(false);
    }
  };

  const handleCaptionBlur = (e) => {
    const caption = e.target;
    setContent(editorRef.current.innerHTML);
    const parentContainer = caption.closest('.image-alignment-container');
    const selection = window.getSelection();
    const range = document.createRange();
    const spacer = document.createTextNode('\u200B');
    parentContainer.parentNode.insertBefore(spacer, parentContainer.nextSibling);
    range.setStartAfter(spacer);
    range.setEndAfter(spacer);
    selection.removeAllRanges();
    selection.addRange(range);
    editorRef.current.focus();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const cursorPosition = saveCursorPosition();

        const alignmentContainer = document.createElement('div');
        alignmentContainer.className = 'image-alignment-container';
        const editorAlignment = editorRef.current.style.textAlign || 'left';
        alignmentContainer.style.textAlign = editorAlignment;

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'image-wrapper';
        imageWrapper.style.width = '300px';

        const imageContainer = document.createElement('div');
        imageContainer.style.position = 'relative';
        imageContainer.style.display = 'inline-block';
        imageContainer.className = 'resizable-image-container';

        const img = document.createElement('img');
        img.src = event.target.result;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.maxWidth = '100%';

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.width = '8px';
        resizeHandle.style.height = '8px';
        resizeHandle.style.background = '#3182ce';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.cursor = 'se-resize';

        const caption = document.createElement('div');
        caption.className = 'image-caption';
        caption.contentEditable = true;
        caption.textContent = 'Enter caption here...';
        caption.style.color = '#a0aec0';
        caption.style.fontStyle = 'italic';
        caption.style.marginTop = '5px';

        imageContainer.appendChild(img);
        imageContainer.appendChild(resizeHandle);
        imageWrapper.appendChild(imageContainer);
        alignmentContainer.appendChild(imageWrapper);
        alignmentContainer.appendChild(caption);

        const selection = window.getSelection();
        const range = document.createRange();

        if (cursorPosition && editorRef.current.contains(cursorPosition.startContainer)) {
          range.setStart(cursorPosition.startContainer, cursorPosition.startOffset);
          range.insertNode(alignmentContainer);
          const spacer = document.createTextNode('\u200B');
          range.insertNode(spacer);
          range.setStartAfter(spacer);
          range.setEndAfter(spacer);
        } else {
          editorRef.current.appendChild(alignmentContainer);
          const spacer = document.createTextNode('\u200B');
          editorRef.current.appendChild(spacer);
          range.setStartAfter(spacer);
          range.setEndAfter(spacer);
        }

        selection.removeAllRanges();
        selection.addRange(range);
        editorRef.current.focus();

        addResizeListener(imageContainer, resizeHandle);
        caption.addEventListener('blur', handleCaptionBlur);
        caption.dataset.listenerAdded = 'true';
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
    const wrapper = container.closest('.image-wrapper');

    const startX = e.pageX;
    const startWidth = parseInt(window.getComputedStyle(img).width);
    const startHeight = parseInt(window.getComputedStyle(img).height);
    const aspectRatio = startWidth / startHeight;

    const doResize = (e) => {
      const diffX = e.pageX - startX;
      let newWidth = Math.max(50, startWidth + diffX);
      let newHeight = newWidth / aspectRatio;

      wrapper.style.width = `${newWidth}px`;
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

  const toggleEmojiPicker = () => {
    if (!showEmojiPicker) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const toggleAudioOptions = () => {
    if (!showAudioOptions) {
      const rect = audioButtonRef.current.getBoundingClientRect();
      setAudioOptionsPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowAudioOptions(!showAudioOptions);
  };

  const AudioOptions = () => (
    <div
      className="audio-options-dropdown"
      style={{ top: audioOptionsPosition.top, left: audioOptionsPosition.left }}
    >
      <button type="button" onClick={startRecording}>Start Recording</button>
      <button type="button" onClick={stopRecording}>Stop Recording</button>
      <input
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        style={{ display: 'none' }}
        id="add-audio"
      />
      <label htmlFor="add-audio">Upload Audio</label>
    </div>
  );

  const EmojiPicker = () => (
    <div
      className="emoji-picker"
      style={{ top: emojiPickerPosition.top, left: emojiPickerPosition.left }}
    >
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
          <button type="button" onClick={addSeparatorLine} title="Add Separator Line">
            <FaMinus />
          </button>
        </div>
        <div className="toolbar-separator" />
        <div className="media-section">
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="add-images" />
          <label htmlFor="add-images" className="toolbar-btn" title="Add Images">
            <FaImage />
          </label>
          <div className="emoji-container">
            <button
              type="button"
              ref={emojiButtonRef}
              onClick={toggleEmojiPicker}
              title="Add Emoji"
              className={showEmojiPicker ? 'active' : ''}
            >
              <FaSmile />
            </button>
          </div>
          <div className="audio-control-container">
            <button
              type="button"
              ref={audioButtonRef}
              onClick={toggleAudioOptions}
              title="Audio Options"
              className={showAudioOptions ? 'active' : ''}
            >
              <FaMicrophone />
            </button>
          </div>
        </div>
      </div>
      <svg style={{ display: 'none' }}>
        <defs>
          <symbol id="fa-play" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </symbol>
          <symbol id="fa-pause" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6zm8-14v14h4V5z"/>
          </symbol>
          <symbol id="fa-volume-up" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </symbol>
          <symbol id="fa-volume-mute" viewBox="0 0 24 24">
            <path d="M7 9v6h4l5 5V4l-5 5H7zm11.36 1.64l-1.41-1.41L15.59 10.59l1.41 1.41 1.36-1.36zm-2.12 2.12l1.41 1.41 1.36-1.36-1.41-1.41-1.36 1.36zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </symbol>
        </defs>
      </svg>
      {showEmojiPicker && createPortal(<EmojiPicker />, document.body)}
      {showAudioOptions && createPortal(<AudioOptions />, document.body)}
    </div>
  );
};

export default TextEditor;