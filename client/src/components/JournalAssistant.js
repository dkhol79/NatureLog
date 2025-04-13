import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper for fetching real-time weather
const fetchWeather = async (location) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}`
    );
    return {
      description: response.data.weather[0]?.description || 'clear skies',
      temp: response.data.main?.temp ? `${Math.round(response.data.main.temp - 273.15)}°C` : '',
    };
  } catch (err) {
    console.error('Weather API error:', err);
    return { description: 'today’s skies', temp: '' };
  }
};

// Helper for sentiment detection
const detectSentiment = (entryText) => {
  const positiveWords = ['happy', 'excited', 'beautiful', 'peaceful'];
  const reflectiveWords = ['thought', 'memory', 'quiet', 'deep'];
  const adventurousWords = ['explore', 'adventure', 'wild', 'journey'];

  const text = entryText.toLowerCase();
  let score = { positive: 0, reflective: 0, adventurous: 0 };

  positiveWords.forEach((word) => { if (text.includes(word)) score.positive += 1; });
  reflectiveWords.forEach((word) => { if (text.includes(word)) score.reflective += 1; });
  adventurousWords.forEach((word) => { if (text.includes(word)) score.adventurous += 1; });

  return Object.keys(score).reduce((a, b) => (score[a] > score[b] ? a : b), 'positive');
};

const JournalAssistant = ({ date, location, categories, token }) => {
  const [needsInspiration, setNeedsInspiration] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [greeting, setGreeting] = useState('');
  const [userHistory, setUserHistory] = useState(null);
  const [recentPromptTypes, setRecentPromptTypes] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]); // Track recent questions/stories

  // Greetings in different languages
const greetings = [
  { language: 'French', morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir' },
  { language: 'Spanish', morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas noches' },
  { language: 'German', morning: 'Guten Morgen', afternoon: 'Guten Tag', evening: 'Guten Abend' },
  { language: 'Italian', morning: 'Buongiorno', afternoon: 'Buon pomeriggio', evening: 'Buonasera' },
  { language: 'Japanese', morning: 'Ohayō', afternoon: 'Konnichiwa', evening: 'Konbanwa' },
  { language: 'Swahili', morning: 'Habari za asubuhi', afternoon: 'Habari za mchana', evening: 'Habari za jioni' },
  { language: 'Hindi', morning: 'Namaste', afternoon: 'Namaste', evening: 'Namaste' },
  { language: 'Arabic', morning: 'Sabah al-khayr', afternoon: 'Masā’ al-khayr', evening: 'Masā’ al-khayr' },
  { language: 'Indonesian', morning: 'Selamat pagi', afternoon: 'Selamat siang', evening: 'Selamat malam' },
  { language: 'Thai', morning: 'Sàwàtdee kráp/kâ', afternoon: 'Sàwàtdee kráp/kâ', evening: 'Sàwàtdee kráp/kâ' },
  { language: 'Vietnamese', morning: 'Chào buổi sáng', afternoon: 'Chào buổi chiều', evening: 'Chào buổi tối' },
  { language: 'Filipino', morning: 'Magandang umaga', afternoon: 'Magandang hapon', evening: 'Magandang gabi' },
  { language: 'Portuguese', morning: 'Bom dia', afternoon: 'Boa tarde', evening: 'Boa noite' },
  { language: 'Russian', morning: 'Dobroe utro', afternoon: 'Dobryy den', evening: 'Dobryy vecher' },
  { language: 'Malay', morning: 'Selamat pagi', afternoon: 'Selamat tengah hari', evening: 'Selamat malam' },
  { language: 'Khmer', morning: 'Suostei tisap', afternoon: 'Suostei mon dom', evening: 'Suostei sayum' },
  { language: 'Lao', morning: 'Sabaidee ton sao', afternoon: 'Sabaidee ton suai', evening: 'Sabaidee ton lam' },
  { language: 'Burmese', morning: 'Mingalaba', afternoon: 'Mingalaba', evening: 'Mingalaba' },
  { language: 'Mandarin', morning: 'Zǎo shàng hǎo', afternoon: 'Xià wǔ hǎo', evening: 'Wǎn shàng hǎo' },
  { language: 'Korean', morning: 'Annyeonghaseyo', afternoon: 'Annyeonghaseyo', evening: 'Annyeonghaseyo' },
  { language: 'Bengali', morning: 'Suprabhat', afternoon: 'Subha aparahna', evening: 'Subha sandhya' },
  { language: 'Tamil', morning: 'Kālai vaṇakkam', afternoon: 'Matiya vaṇakkam', evening: 'Mālai vaṇakkam' },
  { language: 'Zulu', morning: 'Sawubona', afternoon: 'Sawubona', evening: 'Sawubona' },
  { language: 'Yoruba', morning: 'E kaaro', afternoon: 'E kaasan', evening: 'E ku irole' },
  { language: 'Hausa', morning: 'Barka da safiya', afternoon: 'Barka da rana', evening: 'Barka da yamma' },
  { language: 'Turkish', morning: 'Günaydın', afternoon: 'İyi günler', evening: 'İyi akşamlar' },
  { language: 'Polish', morning: 'Dzień dobry', afternoon: 'Dzień dobry', evening: 'Dobry wieczór' },
  { language: 'Dutch', morning: 'Goedemorgen', afternoon: 'Goedemiddag', evening: 'Goedenavond' },
  { language: 'Greek', morning: 'Kaliméra', afternoon: 'Kalispéra', evening: 'Kalínikta' },
  { language: 'Maori', morning: 'Kia ora', afternoon: 'Kia ora', evening: 'Kia ora' },
  { language: 'Amharic', morning: 'Endemen adderk', afternoon: 'Endemen walta', evening: 'Endemen amesha' },
  { language: 'Sinhala', morning: 'Subha udesanak', afternoon: 'Subha havasak', evening: 'Subha ratriyak' },
  { language: 'Telugu', morning: 'Śubhōdayaṁ', afternoon: 'Śubha madhyāhnaṁ', evening: 'Śubha rātri' },
  { language: 'Urdu', morning: 'Subah bakhair', afternoon: 'Dopahar bakhair', evening: 'Shaam bakhair' },
  { language: 'Farsi', morning: 'Sobh bekheyr', afternoon: 'B’ad az zohr bekheyr', evening: 'Shab bekheyr' },
  { language: 'Shona', morning: 'Mhoro wakadini zvako', afternoon: 'Mhoro masikati', evening: 'Mhoro manheru' },
  { language: 'Igbo', morning: 'Ụtụtụ ọma', afternoon: 'Ehihie ọma', evening: 'Mgbede ọma' },
  { language: 'Tswana', morning: 'Dumela moso', afternoon: 'Dumela motshegare', evening: 'Dumela bosigo' },
  { language: 'Finnish', morning: 'Hyvää huomenta', afternoon: 'Hyvää iltapäivää', evening: 'Hyvää iltaa' },
  { language: 'Swedish', morning: 'God morgon', afternoon: 'God eftermiddag', evening: 'God kväll' },
  { language: 'Norwegian', morning: 'God morgen', afternoon: 'God ettermiddag', evening: 'God kveld' },
  { language: 'Danish', morning: 'Godmorgen', afternoon: 'God eftermiddag', evening: 'Godaften' },
  { language: 'Czech', morning: 'Dobré ráno', afternoon: 'Dobrý den', evening: 'Dobrý večer' },
  { language: 'Slovak', morning: 'Dobré ráno', afternoon: 'Dobrý deň', evening: 'Dobrý večer' },
  { language: 'Hungarian', morning: 'Jó reggelt', afternoon: 'Jó napot', evening: 'Jó estét' },
  { language: 'Romanian', morning: 'Bună dimineața', afternoon: 'Bună ziua', evening: 'Bună seara' },
  { language: 'Bulgarian', morning: 'Dobro utro', afternoon: 'Dobar den', evening: 'Dobar vecher' },
  { language: 'Serbian', morning: 'Dobro jutro', afternoon: 'Dobar dan', evening: 'Dobro veče' },
  { language: 'Croatian', morning: 'Dobro jutro', afternoon: 'Dobar dan', evening: 'Dobra večer' },
  { language: 'Ukrainian', morning: 'Dobryy ranok', afternoon: 'Dobryy den', evening: 'Dobryy vechir' },
  { language: 'Hebrew', morning: 'Boker tov', afternoon: 'Tzohorayim tovim', evening: 'Erev tov' },
  { language: 'Pashto', morning: 'Saharo pa khair', afternoon: 'Gharma pa khair', evening: 'Makhama pa khair' },
  { language: 'Malayalam', morning: 'Suprabhatham', afternoon: 'Subha madhyahnam', evening: 'Subha sayahnnam' },
  { language: 'Kannada', morning: 'Śubha prabhāta', afternoon: 'Śubha madhyāna', evening: 'Śubha sāyankāla' },
  { language: 'Gujarati', morning: 'Suprabhat', afternoon: 'Subh dopahar', evening: 'Subh sandhya' },
  { language: 'Marathi', morning: 'Suprabhat', afternoon: 'Subh dupar', evening: 'Subh sanj' },
  { language: 'Punjabi', morning: 'Sat sri akaal', afternoon: 'Sat sri akaal', evening: 'Sat sri akaal' },
  { language: 'Nepali', morning: 'Subha prabhat', afternoon: 'Subha diuso', evening: 'Subha sanjh' },
  { language: 'Navajo', morning: 'Yáʼátʼééchąąʼí', afternoon: 'Yáʼátʼééchąąʼí', evening: 'Yáʼátʼééchąąʼí' },
  { language: 'Quechua', morning: 'Allin p’unchaw', afternoon: 'Allin ch’isi', evening: 'Allin tuta' }
];

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return `${randomGreeting[timeOfDay]} (from ${randomGreeting.language})`;
  };

  // Fetch user-specific data
  const fetchUserData = async () => {
    try {
      const journalResponse = await axios.get('/api/journal/metadata', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accountResponse = await axios.get('/api/account', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const entriesWithSentiment = journalResponse.data.entries.map((entry) => ({
        ...entry,
        sentiment: detectSentiment(entry.text || ''),
      }));

      setUserHistory({
        entries: entriesWithSentiment,
        categoryCounts: journalResponse.data.categoryCounts || {},
        locations: journalResponse.data.locations || [],
        species: journalResponse.data.species || [],
        favoriteLocations: accountResponse.data.preferences?.favoriteLocations || [],
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setUserHistory({
        entries: [],
        categoryCounts: {},
        locations: [],
        species: [],
        favoriteLocations: [],
      });
    }
  };

  // Analyze user data for context
  const analyzeUserData = async () => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
    const month = new Date(date).getMonth();
    const seasonalPrefixes = ['wintry', 'blooming', 'sunlit', 'crisp'][Math.floor(month / 3) % 4];
    const weather = location ? await fetchWeather(location) : { description: 'today’s skies', temp: '' };

    if (!userHistory || !userHistory.entries.length) {
      const genericSettings = ['misty forest', 'sunny coastline', 'grassy meadow', 'rocky canyon'];
      return {
        category: categories[Math.floor(Math.random() * categories.length)] || 'Nature',
        setting: `${seasonalPrefixes} ${genericSettings[Math.floor(Math.random() * genericSettings.length)]}`,
        sentiment: 'positive',
        timeOfDay,
        weather,
      };
    }

    const { entries, categoryCounts, locations, favoriteLocations } = userHistory;
    const recentEntries = entries.filter(
      (entry) => new Date(entry.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const sentiment = recentEntries.length
      ? Object.keys(
          recentEntries.reduce((acc, entry) => {
            acc[entry.sentiment] = (acc[entry.sentiment] || 0) + 1;
            return acc;
          }, {})
        ).reduce((a, b) => (recentEntries.filter((e) => e.sentiment === a).length > recentEntries.filter((e) => e.sentiment === b).length ? a : b), 'positive')
      : 'positive';

    const totalEntries = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    const categoryWeights = Object.entries(categoryCounts).map(([cat, count]) => ({
      category: cat,
      weight: count / (totalEntries || 1),
    }));

    let selectedCategory = categoryWeights[0]?.category || categories[0] || 'Nature';
    let rand = Math.random();
    for (const { category, weight } of categoryWeights) {
      rand -= weight;
      if (rand <= 0) {
        selectedCategory = category;
        break;
      }
    }

    // Select setting
    let setting = `${seasonalPrefixes} spot`;
    if (location && Math.random() < 0.4) {
      setting = `${seasonalPrefixes} spot near your town`;
    } else if (favoriteLocations.length && Math.random() < 0.6) {
      const fav = favoriteLocations[Math.floor(Math.random() * favoriteLocations.length)];
      setting = `${seasonalPrefixes} place around ${fav.location}`;
    } else if (locations.length) {
      const locationCounts = locations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {});
      const weightedLocations = Object.entries(locationCounts).map(([loc, count]) => ({
        location: loc,
        weight: count / locations.length,
      }));
      rand = Math.random();
      for (const { location: loc, weight } of weightedLocations) {
        rand -= weight;
        if (rand <= 0) {
          setting = `${seasonalPrefixes} spot in ${loc}`;
          break;
        }
      }
    }

    return { category: selectedCategory, setting, sentiment, timeOfDay, weather };
  };

  // Generate AI-crafted message
  const generateMessage = async () => {
    const context = await analyzeUserData();
    const { category, setting, sentiment, timeOfDay, weather } = context;

    // Randomly choose message type
    const messageTypes = ['question', 'story', 'joke', 'challenge'];
    const recentTypes = recentMessages.map((m) => m.type).slice(-5);
    const availableTypes = messageTypes.filter((t) => !recentTypes.slice(-2).includes(t));
    const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)] || messageTypes[Math.floor(Math.random() * messageTypes.length)];

    // Build AI prompt
    const aiPrompt = `
      Craft a ${selectedType} for a nature journaling app that’s fun, creative, personal, and engaging. It should inspire the user to write about nature, tied to their interests in ${category}, a setting like "${setting}", and current weather like "${weather.description}${weather.temp ? `, ${weather.temp}` : ''}". The tone should match a ${sentiment} mood and suit the ${timeOfDay}. Make it conversational, like a friend chatting, with no em-dashes or stiff phrasing. Include a playful nudge, joke, or quirky twist if it fits. Keep it 50-100 words. Avoid repeating ideas from these recent prompts: ${recentMessages.map((m) => `"${m.text}"`).join(', ') || 'none'}. Return only the ${selectedType} text.
    `;

    let messageText;
    try {
      const response = await axios.post(
        'https://api.huggingface.co/models/gpt2/generate', // Placeholder; replace with Grok 3 if available
        { inputs: aiPrompt.trim() },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HF_API_KEY}`,
          },
        }
      );
      messageText = response.data.generated_text?.trim() || `What’s ${category.toLowerCase()} up to in ${setting} this ${timeOfDay}? Spill the tea!`;
    } catch (err) {
      console.error('NLP API error:', err);
      // Fallback to a simple crafted message
      messageText = `Hey, what’s ${category.toLowerCase()} whispering in ${setting} under ${weather.description}? Bet you’ve got a wild story!`;
    }

    // Store message with type
    setRecentMessages((prev) => [...prev, { type: selectedType, text: messageText }].slice(-10));
    return messageText;
  };

  // Prompt styles (simplified for brevity)
  const promptStyles = [
    {
      type: 'adventure',
      template: (category, setting, detail, weather) =>
        `Picture yourself roaming through ${setting} this ${new Date(date).toLocaleString('en-US', { month: 'long' })}${weather ? `, ${weather.description} all around` : ''}. You spot ${category.toLowerCase()}${detail ? `—maybe a ${detail}` : ''}. Something unexpected grabs you—a sound, a shadow. What’s it like, and where does this spark take you?`,
    },
    {
      type: 'introspection',
      template: (category, setting, detail, weather) =>
        `Find a cozy spot in ${setting}${weather ? `, with ${weather.description}` : ''}, near some ${category.toLowerCase()}${detail ? `, like a ${detail}` : ''}. Let the moment sink in—what’s it stirring inside you? Write how this place ties to something real in your life.`,
    },
    {
      type: 'dialogue',
      template: (category, setting, detail, weather) =>
        `You’re in ${setting}${weather ? ` under ${weather.description}` : ''}, eyeing some ${category.toLowerCase()}${detail ? `—a ${detail}` : ''}. Imagine it could talk. What’s its story? Write your chat, soaking in the vibes around you.`,
    },
    {
      type: 'scientific',
      template: (category, setting, detail, weather) =>
        `Stand in ${setting} this ${new Date(date).toLocaleString('en-US', { month: 'long' })}${weather ? `, with ${weather.description}` : ''}, studying ${category.toLowerCase()}${detail ? `, like a ${detail}` : ''}. Notice the light, the textures, the air. What’s different today? Write it down.`,
    },
  ];

  // Generate inspiration prompt
  const generatePrompt = async () => {
    const context = await analyzeUserData();
    const availableStyles = promptStyles.filter(
      (style) => !recentPromptTypes.slice(-3).includes(style.type)
    );
    const selectedStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)] || promptStyles[0];

    let generatedPrompt = selectedStyle.template(context.category, context.setting, '', context.weather);

    try {
      const apiInput = `Make this journal prompt vivid, immersive, and conversational, like a friend sharing a story idea. Add a playful joke or witty comment. Keep it 200-300 words: "${generatedPrompt}"`;
      const response = await axios.post(
        'https://api.huggingface.co/models/gpt2/generate',
        { inputs: apiInput },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HF_API_KEY}`,
          },
        }
      );
      generatedPrompt = response.data.generated_text?.trim() || generatedPrompt;
    } catch (err) {
      console.error('NLP API error:', err);
    }

    setPrompt(generatedPrompt);
    setRecentPromptTypes((prev) => [...prev, selectedStyle.type].slice(-5));
  };

  // Initialize component
  const [chatMessage, setChatMessage] = useState('');
  useEffect(() => {
    setGreeting(getGreeting());
    if (token) {
      fetchUserData();
    }
    generateMessage().then(setChatMessage);
  }, [token]);

  // Handle inspiration choice
  const handleInspirationChoice = (choice) => {
    setNeedsInspiration(choice);
    if (choice) {
      generatePrompt();
    } else {
      setPrompt('');
    }
    generateMessage().then(setChatMessage);
  };

  return (
    <div className="journal-assistant">
      <div className="chat-bubble">
        <p className="chat-message">
          {greeting}! {chatMessage}
        </p>
        <div className="inspiration-buttons">
          {prompt ? (
            <button type="button" onClick={generatePrompt} className="more-inspiration">
              Give me more inspiration
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleInspirationChoice(true)}
                className={needsInspiration === true ? 'selected' : ''}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleInspirationChoice(false)}
                className={needsInspiration === false ? 'selected' : ''}
              >
                No
              </button>
            </>
          )}
        </div>
      </div>
      {prompt && (
        <div className="chat-bubble prompt-bubble">
          <p className="chat-message">
            <strong>Inspiration:</strong> {prompt}
          </p>
        </div>
      )}
    </div>
  );
};

export default JournalAssistant;