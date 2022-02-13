const API_KEY = 'RGAPI-3da4be33-94da-48e1-86e5-82e56c6e3bcf'
const MATCH_COUNT = 15

async function getSummonerData(summoner) {
    const SUMMONER_URL = `https://la2.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${API_KEY}`
    let responseSummonerData = await fetch(SUMMONER_URL)
    const summonerData = await responseSummonerData.json()
    return summonerData
}

async function getMatchDataList(summonerPuuid) {
    const MATCH_ID_LIST_URL = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${summonerPuuid}/ids?start=0&count=${MATCH_COUNT}&api_key=${API_KEY}`
    let responseMatchIds = await fetch(MATCH_ID_LIST_URL)
    const matchIdList = await responseMatchIds.json()
    
    const matchPromisesList = matchIdList.map(async id => {
        const MATCH_DATA_URL = `https://americas.api.riotgames.com/lol/match/v5/matches/${id}?api_key=${API_KEY}`
        let responseMatch = await fetch(MATCH_DATA_URL)
        let matchData = await responseMatch.json()
        return matchData
    })
    
    const matchList = await Promise.all(matchPromisesList)
    return matchList
}

async function getRankedInfo(encrypedId) {
    let RANKED_INFO_URL = `https://la2.api.riotgames.com/lol/league/v4/entries/by-summoner/${encrypedId}?api_key=${API_KEY}`
    let responseRankedInfo = await fetch(RANKED_INFO_URL)
    let rankedInfo = await responseRankedInfo.json()
    return rankedInfo
}

function matchBox (matchArr) {
    let classType;
    let matchResult;
    let kills = matchArr['kills']
    let deaths = matchArr['deaths']
    let assists = matchArr['assists']
    let championName = matchArr['championName']
    let gameDuration = matchArr['gameDuration']
    let kda;
    deaths === 0 ? kda = kills + assists : kda = (kills + assists) / deaths

    let remake = (matchArr.gameDuration).split(":")
    if (remake[0] < 4) {
        classType = 'match-remake'
        matchResult = 'Remake'
    } else {
        if (matchArr['win']) {
            classType = 'match-won'
            matchResult = 'Victory'
        } else {
            classType = 'match-lost'
            matchResult = 'Defeat'
        }

    }
    

    return `
    <div class="${classType} match-card">
        <div class="champion-info">
            <div class="champion-info-img" style="background-image: url(http://ddragon.leagueoflegends.com/cdn/12.3.1/img/champion/${championName}.png"></div>
            <div class="game-result">
                ${matchResult}
                <span>${gameDuration} minutes</span>
            </div>
        </div>

        <div class="result-info">
            <div class="result-info-score">${kills} / ${deaths} / ${assists}</div>
            <div class="result-info-kda">${(kda).toFixed(1)} KDA</div>
        </div>
    </div>
    `
}

function profileContainerGen(summonerData, rankedData, lastPlayedChampName) {
    let nickname = rankedData[0].summonerName
    let profileIconId = summonerData.profileIconId
    let summonerLevel = summonerData.summonerLevel
    let tier = rankedData[0].tier
    let rank = rankedData[0].rank
    let totalWins = rankedData[0].wins
    let totalLosses = rankedData[0].losses
    let leaguePoints = rankedData[0].leaguePoints
    let rankStr;
    switch (rank) {
        case 'I':
            rankStr = 1;
            break;
        case 'II':
            rankStr = 2;
            break;
        case 'III':
            rankStr = 3;
            break;
        case 'IV':
            rankStr = 4;  
            break;
    }


    return `
    <div class="profile-champion-cover" style="background-image: url(http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${lastPlayedChampName}_0.jpg);"></div>
    <div class="profile-container-info">
        
        <div class="profile-logo-summoner">

            <div class="profile-icon-container"><div class="profile-icon" style="background-image: url(http://ddragon.leagueoflegends.com/cdn/10.18.1/img/profileicon/${profileIconId}.png);"></div></div>
            
            <div class="profile-summoner-nickname">
                <span class="nickname">${nickname}</span>
                <span class="level">Lvl ${summonerLevel}</span>
            </div>
        </div>
        <div class="profile-container-elo">
            <div class="elo-img"><div class="img" style="background-image: url(https://opgg-static.akamaized.net/images/medals/${tier.toLowerCase()}_${rankStr}.png);"></div></div>
            <div class="elo-text-container">
                <span class="elo-text">${tier} ${rank}</span>
                <span class="elo-games">${leaguePoints} LP / ${totalWins}W ${totalLosses}L</span>
            </div>
        </div>
    </div>
    `
}


function MatchCard(MatchDataList, playerID) {
    let MatchCardArr = MatchDataList.map((match) => {
        let MatchInfoObj = {}
        let idPosition = match.metadata.participants.indexOf(playerID, 0)

        if (idPosition > 4) {
            let winBoolean = match.info.teams[1].win
            MatchInfoObj.win = winBoolean
        } else {
            let winBoolean = match.info.teams[0].win
            MatchInfoObj.win = winBoolean
        }

        let gameDuration = () => {
            let minutes = Math.floor(match.info.gameDuration / 60)
            let seconds = match.info.gameDuration % 60
            return `${minutes}:${seconds.toString().length === 1 ? seconds.toString().padStart(2,0) : seconds}`
        }

        MatchInfoObj.kills = match.info.participants[idPosition]['kills']
        MatchInfoObj.deaths = match.info.participants[idPosition]['deaths']
        MatchInfoObj.assists = match.info.participants[idPosition]['assists']
        MatchInfoObj.championName = match.info.participants[idPosition]['championName']
        MatchInfoObj.gameDuration = gameDuration()

        return MatchInfoObj
    })
    return MatchCardArr
}

function getLastPlayedChamp(MatchDataList, playerID) {
    let lastPlayedGame = MatchDataList[0]
    let idPosition = lastPlayedGame.metadata.participants.indexOf(playerID, 0)
    return lastPlayedGame.info.participants[idPosition].championName    
}

function averageKdaCalc(MatchCardsList) {
    const kdaArr = MatchCardsList.map((matchArr) => {
        if (matchArr.deaths === 0) {
            return (matchArr.kills + matchArr.assists)
        } else {
            return (matchArr.kills + matchArr.assists) / matchArr.deaths
        }
    })
    const kdaSum = kdaArr.reduce((previousVal, currentVal) => {
        return previousVal + currentVal
    })
    return (kdaSum / kdaArr.length)
}

function matchResultsCalc(MatchCardsList) {
    let winRemakeLoss = {'wins' : 0, 'remakes' : 0, 'losses' : 0}

    for (let i=0; i <= (MatchCardsList.length - 1); i++) {
        let remake = (MatchCardsList[i].gameDuration).split(":")

        if (remake[0] < 4) {
            winRemakeLoss['remakes'] =+ 1

        } else {

            if (MatchCardsList[i].win === true) {
                winRemakeLoss['wins'] += 1
            } else {
                winRemakeLoss['losses'] += 1;
            }
                
        }
    }
    return winRemakeLoss
}

function recentMatchContainerBox(MatchCardsList) {
    let averageKda = (Math.round(averageKdaCalc(MatchCardsList) * 10) / 10)
    let matchResults = matchResultsCalc(MatchCardsList)
    

    return `
    <div class="last-matches">
        <span>Last ${MATCH_COUNT} matches</span>
        <div>${averageKda} KDA</div>
    </div>
    <div class="last-matches-total">
        <div class="last-matches-total-txt">
            <span style="width:${(matchResults.wins * 10)}%;">${matchResults.wins}</span>
            <span style="width:${(matchResults.remakes * 10)}%;">${matchResults.remakes}</span>
            <span style="width:${(matchResults.losses * 10)}%;">${matchResults.losses}</span>
        </div>
        <div class="last-matches-total-bar">
            <div class="bar-wins" style="width:${(matchResults.wins * 10)}%;"></div>
            <div class="bar-remakes" style="width:${(matchResults.remakes * 10)}%;"></div>
            <div class="bar-losses" style="width:${(matchResults.losses * 10)}%;"></div>
        </div>
    </div>`
}


const button = document.getElementById('summoner-button')
const summonerNameInput = document.getElementById('summoner-input')
const matchesContainer = document.getElementById('match-container')
const recentMatchesContainer = document.getElementById('recent-matches-container')
const profileContainer = document.getElementById('profile-container')
let summonerData;


button.onclick = function () {
    let summonerName = summonerNameInput.value

    getSummonerData(summonerName).then((summonerPromise) => {
        summonerData = summonerPromise
        summonerPuuid = summonerData.puuid
        summonerEncryptedId = summonerData.id
        
        getMatchDataList(summonerPuuid).then((MatchDataList) => {
            let MatchCardsList = MatchCard(MatchDataList, summonerPuuid)

            recentMatchesContainer.innerHTML = recentMatchContainerBox(MatchCardsList)

            const matchContainerList = MatchCardsList.map((matchArr) => {
                return matchBox(matchArr)
            })
            matchesContainer.innerHTML = `
            ${matchContainerList.join("")}
            `

            let lastPlayedChampName = getLastPlayedChamp(MatchDataList, summonerPuuid)
            
            getRankedInfo(summonerEncryptedId).then((rankedData) => {
    
                let profileContainerHtml = profileContainerGen(summonerData, rankedData, lastPlayedChampName)
                profileContainer.innerHTML = profileContainerHtml
            })
        })

    
    })
    
    
}
