(async function onebyoneLyrics() {
  const { Platform, URI, React, ReactDOM } = Spicetify;
  if (!(Platform && URI && React && ReactDOM)) {
    setTimeout(onebyoneLyrics, 1000);
    return;
  }

  const lyricsContainer = document.createElement("div");
  lyricsContainer.id = "onebyone-lyrics-container";
  lyricsContainer.style.position = "fixed";
  lyricsContainer.style.bottom = "20px";
  lyricsContainer.style.left = "20px";
  lyricsContainer.style.background = "rgba(0,0,0,0.6)";
  lyricsContainer.style.padding = "1rem";
  lyricsContainer.style.borderRadius = "8px";
  lyricsContainer.style.zIndex = "9999";
  lyricsContainer.style.fontSize = "1.2rem";
  lyricsContainer.style.fontFamily = "sans-serif";
  lyricsContainer.style.color = "#fff";
  lyricsContainer.style.maxWidth = "300px";
  lyricsContainer.style.wordWrap = "break-word";
  document.body.appendChild(lyricsContainer);

  let currentLyrics = [];
  let currentWordIndex = 0;
  let audio = Spicetify.Player;
  let lastTime = 0;

  async function fetchLyrics(uri) {
    try {
      const trackId = uri.split(":")[2];
      const url = `https://realsafner.github.io/OneByOne-Lyrics/Data/wordlrc/${trackId}.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const json = await response.json();
      
      if (json && json.lyrics && json.lyrics[0] && json.lyrics[0].words) {
        currentLyrics = json.lyrics[0].words;
        lyricsContainer.textContent = "Lyrics loaded";
      } else {
        throw new Error("Invalid lyrics format");
      }
    } catch (e) {
      console.error("Failed to fetch lyrics:", e);
      currentLyrics = [];
      lyricsContainer.textContent = "No synced lyrics available";
    }
    
    currentWordIndex = 0;
    lastTime = 0;
  }

  function updateLyrics() {
    if (!currentLyrics.length) return;
    
    const time = audio.getProgress() / 1000;
    
    if (time < lastTime) {
      currentWordIndex = 0;
    }
    lastTime = time;
    
    while (
      currentWordIndex < currentLyrics.length &&
      currentLyrics[currentWordIndex].start <= time
    ) {
      currentWordIndex++;
    }
    
    const wordIndex = Math.max(0, currentWordIndex - 1);
    const word = currentLyrics[wordIndex];
    
    if (word && word.start <= time) {
      const isActive = !word.end || time < word.end;
      lyricsContainer.textContent = isActive ? word.word : "";
    } else {
      lyricsContainer.textContent = "";
    }
  }

  // Handle song changes
  Spicetify.Player.addEventListener("songchange", () => {
    const track = Spicetify.Player.data?.track;
    if (track && track.uri) {
      fetchLyrics(track.uri);
    }
  });

  let updateInterval;
  
  function startLyricsUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateLyrics, 100);
  }
  
  function stopLyricsUpdate() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }

  Spicetify.Player.addEventListener("onplaypause", (e) => {
    if (e.data.is_paused) {
      stopLyricsUpdate();
    } else {
      startLyricsUpdate();
    }
  });

  const currentTrack = Spicetify.Player.data?.track;
  if (currentTrack && currentTrack.uri) {
    fetchLyrics(currentTrack.uri);
  }

  startLyricsUpdate();

})();