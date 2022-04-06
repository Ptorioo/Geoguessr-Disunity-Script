// ==UserScript==
// @name		Geoguessr Cheat Update (works on all modes)
// @namespace		https://github.com/Ptorioo
// @version		1.0.2
// @description		Press SHIFT + ALT + G and the location of your current geoguessr game will open in a new tab
// @author		tcortega, Ptorioo
// @homepage		https://github.com/Ptorioo
// @downloadURL		https://gist.github.com/Ptorioo/GeoguessrCheat
// @updateURL		https://gist.github.com/Ptorioo/GeoguessrCheat
// @match		http*://*/*
// @grant		none
// @run-at		/^(https?)?(\:)?(\/\/)?([^\/]*\.)?geoguessr\.com($|\/.*)/
// ==/UserScript==

function getCleanUrl() {
  return window.location.href.replace("/reconnect", "").replace("?client=web", "");
}

function getJsonData() {
  const rawData = document.querySelector("pre").innerText;
  return JSON.parse(rawData);
}

function apiUrlToGameUrl() {
  const apiUrl = getCleanUrl();
  return apiUrl.replace("game-server.", "").replace("/api", "").replace("/v3", "").replace("");
}

function getGameMode(url) {
  return url.split(".com/")[1].split("/")[0].toUpperCase();
}

function getApiUrl(url, gamemode) {
  url = url.replace("www.", "");

  switch (gamemode) {
    case "DUELS":
    case "TEAM-DUELS":
    case "LIVE-CHALLENGE":
    case "BATTLE-ROYALE": {
      return url.replace("geoguessr.com", "game-server.geoguessr.com/api").replace("team-duels", "duels");
    }
    case "QUIZ":{
        return url.replace("geoguessr.com/quiz/play", "game-server.geoguessr.com/api/live-challenge");
    }
    case "COMPETITIVE-STREAK": {
      return url.replace("geoguessr.com/competitive-streak", "game-server.geoguessr.com/api/competitive-streaks");
    }

    case "GAME": {
      return url.replace("geoguessr.com/game", "geoguessr.com/api/v3/games");
    }
  }
}

function isApiPage() {
  return getCleanUrl().includes("/api/");
}

function makeApiCall(apiUrl) {
  window.open(apiUrl, "_blank");
}

function handleChallenge() {
  const raw = document.querySelectorAll("#__NEXT_DATA__")[0].text;
  const json = JSON.parse(raw);
  const rounds = json.props.pageProps.game.rounds;
  const { lat, lng } = rounds[rounds.length - 1];

  openMaps({ lat, lng }, "_blank");
}

function handleKeyEvent() {
  const url = getCleanUrl();
  const gameMode = getGameMode(url);

  if (gameMode == "CHALLENGE") return handleChallenge();

  const apiUrl = getApiUrl(url, gameMode);

  makeApiCall(apiUrl);
}

function formatDuelsResponse(jsonData) {
  const rounds = jsonData.rounds.map((r) => ({ lat: r.panorama.lat, lng: r.panorama.lng }));
  return { round: jsonData.currentRoundNumber, rounds };
}

function formatStreaksResponse(jsonData) {
  const rounds = [jsonData.player.currentRound];
  return { round: 1, rounds };
}

function formatLiveChallengeResponse(jsonData) {
  const rounds = jsonData.rounds.map((r) => ({ lat: r.panorama.lat, lng: r.panorama.lng }));
  return { round: jsonData.currentRoundNumber, rounds };
}

function formatBattleRoyaleResponse({ currentRoundNumber, rounds }) {
  return { round: currentRoundNumber, rounds };
}

function formatGameResponse({ round, rounds }) {
  return { round, rounds };
}

function formatResponse(gameMode) {
  const jsonData = getJsonData();

  if (gameMode == "DUELS"|| gameMode == "TEAM-DUELS") return formatDuelsResponse(jsonData);
  if (gameMode == "COMPETITIVE-STREAKS") return formatStreaksResponse(jsonData);
  if (gameMode == "BATTLE-ROYALE") return formatBattleRoyaleResponse(jsonData);
  if (gameMode == "LIVE-CHALLENGE") return formatLiveChallengeResponse(jsonData);
  if (gameMode == "GAMES") return formatGameResponse(jsonData);
}

function getLocation(gameMode) {
  const { round, rounds } = formatResponse(gameMode);

  const currentRound = rounds[round - 1];

  return { lat: currentRound.lat, lng: currentRound.lng };
}

function openMaps(location, target = "_self") {
  const mapUrl = `https://google.com/maps/place/${location.lat},${location.lng}`;
  window.open(mapUrl, target);
}

function handleApiPage() {
  const gameUrl = apiUrlToGameUrl();
  const gameMode = getGameMode(gameUrl);

  const location = getLocation(gameMode);
  openMaps(location);
}

(function () {
  "use strict";

  if (!getCleanUrl().includes("geoguessr.com")) return; // Just in case

  if (isApiPage()) {
    return handleApiPage();
  }

  document.onkeydown = (evt) => {
    evt = evt || window.event;
    if (evt.shiftKey && evt.altKey && evt.keyCode == 71) {
      handleKeyEvent();
    }
  };
})();
