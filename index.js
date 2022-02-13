const API_KEY = 'RGAPI-8ba30b91-c977-432a-9f89-c3dd83fa885f'
const MATCH_COUNT = 20

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
let summonerData;


button.onclick = function () {
    let summonerName = summonerNameInput.value

    getSummonerData(summonerName).then((summonerPromise) => {
        summonerData = summonerPromise
        summonerPuuid = summonerData.puuid
        
        getMatchDataList(summonerPuuid).then((MatchDataList) => {
            let MatchCardsList = MatchCard(MatchDataList, summonerPuuid)
            
            console.log(MatchDataList);

            recentMatchesContainer.innerHTML = recentMatchContainerBox(MatchCardsList)

            const matchContainerList = MatchCardsList.map((matchArr) => {
                return matchBox(matchArr)
            })
            matchesContainer.innerHTML = `
            ${matchContainerList.join("")}
            `

        })
    
    })
    
    
}
