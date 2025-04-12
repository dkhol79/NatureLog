import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JournalAssistant = ({ date, location, categories, token }) => {
  const [needsInspiration, setNeedsInspiration] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [greeting, setGreeting] = useState('');
  const [userHistory, setUserHistory] = useState(null);
  const [recentPromptTypes, setRecentPromptTypes] = useState([]);

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

  // Fetch user-specific data (journal metadata and account preferences)
  const fetchUserData = async () => {
    try {
      // Fetch journal metadata
      const journalResponse = await axios.get('/api/journal/metadata', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch account preferences (for favoriteLocations)
      const accountResponse = await axios.get('/api/account', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserHistory({
        entries: journalResponse.data.entries || [],
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

  // Prompt styles with natural, human-like templates
  const promptStyles = [
    {
      type: 'adventure',
      template: (category, setting, detail) =>
        `Imagine you’re wandering through ${setting} this ${new Date(date).toLocaleString('en-US', { month: 'long' })}. You’re drawn to ${category.toLowerCase()}${detail ? `, perhaps a ${detail}` : ''}. What do you see, hear, or feel as something unexpected catches your attention? Write about that moment and where it leads you.`,
    },
    {
      type: 'introspection',
      template: (category, setting, detail) =>
        `Settle into a quiet corner of ${setting}, surrounded by ${category.toLowerCase()}${detail ? `, like a ${detail}` : ''}. Let the place sink in—what memory or emotion does it stir? Write about how this moment connects you to something deeper in your life.`,
    },
    {
      type: 'dialogue',
      template: (category, setting, detail) =>
        `Picture yourself in ${setting}, noticing a piece of ${category.toLowerCase()}${detail ? `—a ${detail}` : ''}. If it could speak, what story would it share about its life here? Write your conversation, capturing the sounds and colors around you.`,
    },
    {
      type: 'scientific',
      template: (category, setting, detail) =>
        `You’re in ${setting} this ${new Date(date).toLocaleString('en-US', { month: 'long' })}, observing ${category.toLowerCase()}${detail ? `, like a ${detail}` : ''}. Note the details—the light, the textures, the air. What stands out, and how does it change how you see this place? Write it down.`,
    },
  ];

  // Analyze user history and preferences for personalized prompt
  const analyzeUserData = () => {
    if (!userHistory || !userHistory.entries.length) {
      // Fresh start for users with no data
      const genericSettings = ['a quiet forest', 'a breezy coastline', 'a vibrant meadow', 'a rugged mountain trail'];
      return {
        category: categories[Math.floor(Math.random() * categories.length)] || 'Nature',
        setting: genericSettings[Math.floor(Math.random() * genericSettings.length)],
        detail: '',
      };
    }

    const { categoryCounts, locations, species, favoriteLocations } = userHistory;

    // Select category based on user preferences or history
    const totalEntries = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    const categoryWeights = Object.entries(categoryCounts).map(([cat, count]) => ({
      category: cat,
      weight: count / (totalEntries || 1), // Avoid division by zero
    }));

    // Include categories from preferences even if not in entries
    const preferredCategories = Object.keys(userHistory.categoryCounts).filter(
      (cat) => userHistory.categoryCounts[cat]
    );
    if (preferredCategories.length && Math.random() < 0.5) {
      // 50% chance to pick a preferred category
      return {
        category: preferredCategories[Math.floor(Math.random() * preferredCategories.length)],
        setting: selectSetting(locations, favoriteLocations),
        detail: species.length ? species[Math.floor(Math.random() * species.length)] : '',
      };
    }

    // Weighted random category selection from history
    let rand = Math.random();
    let selectedCategory = categoryWeights[0]?.category || categories[0] || 'Nature';
    for (const { category, weight } of categoryWeights) {
      rand -= weight;
      if (rand <= 0) {
        selectedCategory = category;
        break;
      }
    }

    // Select setting prioritizing favoriteLocations, then frequent locations, then current location
    const setting = selectSetting(locations, favoriteLocations);

    // Pick a species if available
    const detail = species.length ? species[Math.floor(Math.random() * species.length)] : '';

    return { category: selectedCategory, setting, detail };
  };

  // Helper to select a setting based on location data
  const selectSetting = (journalLocations, favoriteLocations) => {
    // Prioritize current location if provided
    if (location && Math.random() < 0.3) {
      // 30% chance to use current location for relevance
      return `a spot near ${location}`;
    }

    // Prioritize favoriteLocations (from preferences)
    if (favoriteLocations.length && Math.random() < 0.5) {
      // 50% chance to use a favorite location
      const fav = favoriteLocations[Math.floor(Math.random() * favoriteLocations.length)];
      return `a place around ${fav.location}`;
    }

    // Use frequent journal locations
    if (journalLocations.length) {
      // Weight locations by frequency
      const locationCounts = journalLocations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {});
      const weightedLocations = Object.entries(locationCounts).map(([loc, count]) => ({
        location: loc,
        weight: count / journalLocations.length,
      }));

      let rand = Math.random();
      for (const { location: loc, weight } of weightedLocations) {
        rand -= weight;
        if (rand <= 0) return `a familiar spot in ${loc}`;
      }
      return `a familiar spot in ${journalLocations[0]}`;
    }

    // Fallback to generic setting
    const genericSettings = ['a quiet forest', 'a breezy coastline', 'a vibrant meadow', 'a rugged mountain trail'];
    return genericSettings[Math.floor(Math.random() * genericSettings.length)];
  };

  // Generate a personalized, natural prompt
  const generatePrompt = async () => {
    // Avoid reusing recent prompt types
    const availableStyles = promptStyles.filter(
      (style) => !recentPromptTypes.slice(-3).includes(style.type)
    );
    const selectedStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)] || promptStyles[0];

    const { category, setting, detail } = analyzeUserData();
    let generatedPrompt = selectedStyle.template(category, setting, detail);

    // Add weather context if available
    if (userHistory?.weatherData) {
      const weather = userHistory.weatherData.main?.temp
        ? ` with ${userHistory.weatherData.weather[0]?.description || 'clear skies'} overhead`
        : '';
      generatedPrompt = generatedPrompt.replace(' in ', ` in${weather} `);
    }

    // Refine with DeepAI for polish, but keep it natural
    try {
      const apiInput = `Make this journal prompt vivid, immersive, and conversational, like a friend sharing a story idea. Keep it 200-300 words and avoid formal phrasing: "${generatedPrompt}"`;
      const response = await axios.post(
        'https://api.deepai.org/api/text-generator',
        { text: apiInput },
        {
          headers: {
            'Api-Key': process.env.REACT_APP_DEEPAI_API_KEY,
          },
        }
      );
      generatedPrompt = response.data.output || generatedPrompt;
    } catch (err) {
      console.error('DeepAI API error:', err);
    }

    setPrompt(generatedPrompt);
    setRecentPromptTypes((prev) => [...prev, selectedStyle.type].slice(-5));
  };

  // Initialize greeting and fetch user data
  useEffect(() => {
    if (!token) return;
    setGreeting(getGreeting());
    fetchUserData();
  }, [token]);

  // Handle inspiration choice
  const handleInspirationChoice = (choice) => {
    setNeedsInspiration(choice);
    if (choice) {
      generatePrompt();
    } else {
      setPrompt('');
    }
  };

  return (
    <div className="journal-assistant">
      <div className="chat-bubble">
        <p className="chat-message">
          {greeting}! Ready to capture what nature’s whispering to you today? Need a spark to get going?
        </p>
        <div className="inspiration-buttons">
          {prompt ? (
            <button type="button" onClick={generatePrompt} className="more-inspiration">
              More Inspiration
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