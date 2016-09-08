/********************************************************************************
 This file contains the variables and functions that form the main game screen of 
 the game. The main game progression (dealing, exchanging, revealing, stripping)
 and everything to do with displaying the main game screen.
 ********************************************************************************/
 
/**********************************************************************
 *****                    Game Screen UI Elements                 *****
 **********************************************************************/

/* game banner */
$gameBanner = $("#game-banner");
 
/* main UI elements */
$gameBubbles = [$("#game-bubble-1"),
                $("#game-bubble-2"),
                $("#game-bubble-3"),
                $("#game-bubble-4")];
$gameDialogues = [$("#game-dialogue-1"),
                  $("#game-dialogue-2"),
                  $("#game-dialogue-3"),
                  $("#game-dialogue-4")];
$gameAdvanceButtons = [$("#game-advance-button-1"),
                       $("#game-advance-button-2"),
                       $("#game-advance-button-3"),
                       $("#game-advance-button-4")];
$gameImages = [$("#game-image-1"),
               $("#game-image-2"),
               $("#game-image-3"),
               $("#game-image-4")];
$gameLabels = [$("#game-name-label-0"),
               $("#game-name-label-1"),
               $("#game-name-label-2"),
               $("#game-name-label-3"),
               $("#game-name-label-4")];
$gameOpponentAreas = [$("#game-opponent-area-1"),
                      $("#game-opponent-area-2"),
                      $("#game-opponent-area-3"),
                      $("#game-opponent-area-4")];
$gamePlayerCardArea = $("#player-game-card-area");

/* dock UI elements */
$gameClothingLabel = $("#game-clothing-label");
$gameClothingCells = [$("#player-0-clothing-1"),
                      $("#player-0-clothing-2"),
                      $("#player-0-clothing-3"),
                      $("#player-0-clothing-4"),
                      $("#player-0-clothing-5"),
                      $("#player-0-clothing-6"),
                      $("#player-0-clothing-7"),
                      $("#player-0-clothing-8")];
$mainButton = $("#main-game-button");
$cardButtons = [$("#player-0-card-1"),
				$("#player-0-card-2"),
				$("#player-0-card-3"),
				$("#player-0-card-4"),
				$("#player-0-card-5")];
				
/* restart modal */
$restartModal = $("#restart-modal");
                    
/**********************************************************************
 *****                   Game Screen Variables                    *****
 **********************************************************************/

/* pseudo constants */
var GAME_DELAY = 600;
var FORFEIT_DELAY = 7500;
var GAME_OVER_DELAY = 1000;
var CARD_SUGGEST = false;
var AUTO_FORFEIT = false;
var AUTO_FADE = true;
 
/* colours */
var currentColour = "#63AAE7"; 	/* indicates current turn */
var clearColour = "#FFFFFF";	/* indicates neutral */
var loserColour = "#DD4444";	/* indicates loser of a round */
var winnerColour = "#44DD44";
 
/* game state */
var currentTurn = 0;
var recentLoser = 0;
var recentWinner = 0;
var savedContext = "";
var gameOver = false;
var actualMainButtonState = false;
var prizeTaken = false;
                      
/**********************************************************************
 *****                    Start Up Functions                      *****
 **********************************************************************/
 
/************************************************************
 * Loads all of the content required to display the title 
 * screen.
 ************************************************************/
function loadGameScreen () {
    $gameScreen.show();
    
    /* reset all of the player's states */
    for (var i = 1; i < players.length; i++) {
        players[i].current = 0;
        $gameOpponentAreas[i-1].show();
    }
    $gamePlayerCardArea.show();
    
    /* set up the visuals */
    updateAllGameVisuals();
    
    /* set up the poker library */
    setupPoker();
    
    /* disable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
        $cardButtons[i].attr('disabled', true);
    }
    
    /* enable and set up the main button */
    $mainButton.html("Deal");
    $mainButton.attr("disabled", false);
    actualMainButtonState = false;
}
                      
/**********************************************************************
 *****                      Display Functions                     *****
 **********************************************************************/

/************************************************************
 * Updates all of the main visuals on the main game screen.
 ************************************************************/
function updateGameVisual (player) {
   /* update all opponents */
    if (players[player] && players[player].state) {		
		var chosenState = players[player].state[getRandomNumber(0, players[player].state.length)];
		
        /* update dialogue */
        $gameDialogues[player-1].html(chosenState.dialogue);
        
        /* direct the dialogue bubble */
        $gameBubbles[player-1].show();
        if (players[player].state[players[player].current].direction) {
            $gameBubbles[player-1].removeClass();
            $gameBubbles[player-1].addClass("bordered dialogue-bubble dialogue-"+chosenState.direction);
        } 
        
        /* update image */
        $gameImages[player-1].attr('src', players[player].folder + chosenState.image);
        
        /* update label */
        $gameLabels[player].html(players[player].label);
    } else {
        /* hide their dialogue bubble */
        $gameDialogues[player-1].html("");
        $gameAdvanceButtons[player-1].css({opacity : 0});
        $gameBubbles[player-1].hide();
		
		/* hide their cards */
		for (var i = 0; i < CARDS_PER_HAND; i++) {
			$cardCells[player][i].attr('src', BLANK_CARD_IMAGE);
			fillCard(player, i);
		}
    }
}
 
/************************************************************
 * Updates all of the main visuals on the main game screen.
 ************************************************************/
function updateAllGameVisuals () {
    /* update all opponents */
    for (var i = 1; i < players.length; i++) {
        updateGameVisual (i);
    }
}
 
/************************************************************
 * Updates the visuals of the player clothing cells.
 ************************************************************/
function displayHumanPlayerClothing () {
    /* collect the images */
    var clothingImages = [];
	for (var i = 0; i < 8; i++) {
		if (players[HUMAN_PLAYER].clothing[i]) {
			clothingImages.push(players[HUMAN_PLAYER].clothing[i].image);
		}
	}
    
    /* display the remaining clothing items */
    clothingImages.reverse();
	$gameClothingLabel.html("<b>Your Clothing</b>");
	for (var i = 0; i < 8; i++) {
		if (clothingImages[i]) {
			$gameClothingCells[i].attr('src', clothingImages[i]);
			$gameClothingCells[i].css({opacity: 1});
		} else {
			$gameClothingCells[i].css({opacity: 0});
		}
	}
}

/**********************************************************************
 *****                        Flow Functions                      *****
 **********************************************************************/

/************************************************************
 * Determines what the AI's action will be.
 ************************************************************/
function makeAIDecision () {	
	/* determine the AI's decision */
	determineAIAction(currentTurn);
	
	/* dull the cards they are trading in */
	for (var i = 0; i < hands[currentTurn].tradeIns.length; i++) {
		if (hands[currentTurn].tradeIns[i]) {
			dullCard(currentTurn, i);
		}
	}

	/* determine how many cards are being swapped */
	var swap = 0;
	for (var i = 0; i < hands[currentTurn].cards.length; i++) {
		if (hands[currentTurn].tradeIns[i]) {
			swap++;
		}
	}
	
	/* update a few hardcoded visuals */
	updateBehaviour(currentTurn, SWAP_CARDS, [CARDS], [swap]);
	updateGameVisual(currentTurn);
	
	/* wait and implement AI action */
	window.setTimeout(implementAIAction, GAME_DELAY);
}

/************************************************************
 * Implements the AI's chosen action.
 ************************************************************/
function implementAIAction () {
	exchangeCards(currentTurn);
	
	/* refresh the hand */
	hideHand(currentTurn);
	
	/* update behaviour */
	determineHand(currentTurn);
	if (hands[currentTurn].strength == HIGH_CARD) {
		updateBehaviour(currentTurn, BAD_HAND, [], []);
        updateGameVisual(currentTurn);
	} else if (hands[currentTurn].strength <= TWO_PAIR) {
		updateBehaviour(currentTurn, OKAY_HAND, [], []);
        updateGameVisual(currentTurn);
	} else {
		updateBehaviour(currentTurn, GOOD_HAND, [], []);
        updateGameVisual(currentTurn);
	}
	
	/* wait and then advance the turn */
	window.setTimeout(advanceTurn, GAME_DELAY);
}

/************************************************************
 * Advances the turn or ends the round.
 ************************************************************/
function advanceTurn () {
	currentTurn++;
	if (currentTurn >= players.length) {
		currentTurn = 0;
	}
    
    /* highlight the player who's turn it is */
	for (var i = 0; i < players.length; i++) {
		if (currentTurn == i) {
			$gameLabels[i].css({"background-color" : currentColour});
		} else {
            $gameLabels[i].css({"background-color" : clearColour});
		}
	}
	
	/* check to see if they are still in the game */
	if (players[currentTurn].out && currentTurn > 0) {
		/* update their speech and skip their turn */
        updateBehaviour(currentTurn, players[currentTurn].forfeit[0], [], []);
        updateGameVisual(currentTurn);
			
        window.setTimeout(advanceTurn, GAME_DELAY);
		return;
	}
	
	/* allow them to take their turn */
	if (currentTurn == 0) {
        /* human player's turn */
        if (players[HUMAN_PLAYER].out) {
            $mainButton.html("Reveal");
            if (AUTO_FORFEIT) {
                $mainButton.attr('disabled', true);
                //actualMainButtonState = true;
                setTimeout(advanceGame,FORFEIT_DELAY);
                return;
            }
        } else {
            $mainButton.html("Exchange");
        }
        $mainButton.attr('disabled', false);
        actualMainButtonState = false;
	} else {
        /* AI player's turn */
		makeAIDecision();
	}
}
 
/************************************************************
 * Deals cards to each player and resets all of the relevant 
 * information.
 ************************************************************/
function startDealPhase () {
    /* dealing cards */
	dealLock = 0;
    for (var i = 0; i < players.length; i++) {
        console.log(players[i] + " "+ i);
		if (!players[i].out) {
            /* deal out a new hand to this player */
            dealHand(i);
        } else {
            /* collect the player's hand */
            collectPlayerHand(i);
            
            if (HUMAN_PLAYER == i) {
                $gamePlayerCardArea.hide();
            } 
            else {
                $gameOpponentAreas[i-1].hide();
            }
        }
    }
    
    /* reset trades ins */
    for (var i = 0; i < players.length; i++) {
        for (var j = 0; j < players.length; j++) {
            hands[i].tradeIns[j] = false;
        }
    }
	
	/* IMPLEMENT STACKING/RANDOMIZED TRIGGERS HERE SO THAT AIs CAN COMMENT ON PLAYER "ACTIONS" */
	
	/* clear the labels */
	for (var i = 0; i < players.length; i++) {
		$gameLabels[i].css({"background-color" : clearColour});
	}

	window.setTimeout(checkDealLock, (ANIM_DELAY*(players.length))+ANIM_TIME);
}

/************************************************************
 * Checks the deal lock to see if the animation is finished.
 ************************************************************/
function checkDealLock () {
	/* count the players still in the game */
	var inGame = 0;
	for (var i = 0; i < players.length; i++) {
		if (!players[i].out) {
			inGame++;
		}
	}
	
	/* check the deal lock */
	if (dealLock < inGame * 5) {
		window.setTimeout(checkDealLock, 100);
	} else {
		continueDealPhase();
	}
}

/************************************************************
 * Finishes the deal phase and allows the game to progress.
 ************************************************************/
function continueDealPhase () {
	/* hide the dialogue bubbles */
    for (var i = 1; i < players.length; i++) {
        $gameDialogues[i-1].html("");
        $gameAdvanceButtons[i-1].css({opacity : 0});
        $gameBubbles[i-1].hide();
    }
	
	/* set visual state */
    if (!players[HUMAN_PLAYER].out) {
        showHand(HUMAN_PLAYER);
    }
    for (var i = 1; i < players.length; i++) {
        hideHand(i);
    }
    
    /* enable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
       $cardButtons[i].attr('disabled', false);
    }
	
	/* suggest cards to swap, if enabled */
	if (CARD_SUGGEST && !players[HUMAN_PLAYER].out) {
		determineAIAction(HUMAN_PLAYER);
		
		/* dull the cards they are trading in */
		for (var i = 0; i < hands[HUMAN_PLAYER].tradeIns.length; i++) {
			if (hands[HUMAN_PLAYER].tradeIns[i]) {
				dullCard(HUMAN_PLAYER, i);
			}
		}
	}
    
    /* allow each of the AIs to take their turns */
    currentTurn = 0;
    advanceTurn();
}

/************************************************************
 * Processes everything required to complete the exchange phase
 * of a round. Trades in the cards the player has selected and
 * draws new ones.
 ************************************************************/
function completeExchangePhase () {
    /* exchange the player's chosen cards */
    exchangeCards(HUMAN_PLAYER);
    showHand(HUMAN_PLAYER);
    
    /* disable player cards */
    for (var i = 0; i < $cardButtons.length; i++) {
       $cardButtons[i].attr('disabled', true);
    }
}

/************************************************************
 * Processes everything required to complete the reveal phase
 * of a round. Shows everyone's hand and determines who lost
 * the hand.
 ************************************************************/
function completeRevealPhase () {
    /* reveal everyone's hand */
    for (var i = 0; i < players.length; i++) {
        if (!players[i].out) {
            determineHand(i);
            showHand(i);
        }
    }
    
    /* figure out who has the lowest hand */
    recentLoser = determineLowestHand();
	recentWinner= determineHighestHand();
    console.log("Player "+recentLoser+" is the loser.");
	console.log("Player "+recentWinner+" is the winner.");
    
    /* look for the unlikely case of an absolute tie */
    if (recentLoser == -1) {
        console.log("Fuck... there was an absolute tie");
        /* inform the player */
        
        /* hide the dialogue bubbles */
        for (var i = 1; i < players.length; i++) {
            $gameDialogues[i].html("");
            $gameAdvanceButtons[i].css({opacity : 0});
            $gameBubbles[i].hide();
        }
        
        /* reset the round */
        mainButton.html("Deal");
        $mainButton.attr('disabled', false);
        if (players[HUMAN_PLAYER].out && AUTO_FORFEIT) {
            setTimeout(advanceGame,FORFEIT_DELAY);
        }
        return;
    }
    
    /* update behaviour */
	var clothes = playerMustStrip (recentLoser);
    updateAllGameVisuals();
    
   
	
	   /* highlight the winner */
    for (var i = 0; i < players.length; i++) {
        if (recentWinner == i) {
            $gameLabels[i].css({"background-color" : winnerColour});
        } else {
            $gameLabels[i].css({"background-color" : clearColour});
        }
    }
	
	 /* highlight the loser */
    for (var i = 0; i < players.length; i++) {
        if (recentLoser == i) {
            $gameLabels[i].css({"background-color" : loserColour});
        } else if (!recentWinner == i){
            $gameLabels[i].css({"background-color" : clearColour});
        }
    }
    
    /* set up the main button */
	if (recentLoser != HUMAN_PLAYER && clothes > 0) {
		$mainButton.html("Continue");
	} else {
		$mainButton.html("Strip");
	}
    if (players[HUMAN_PLAYER].out && AUTO_FORFEIT) {
        setTimeout(advanceGame,FORFEIT_DELAY);
    }
}

/************************************************************
 * Processes everything required to complete the continue phase
 * of a round. A very short phase in which a player removes an 
 * article of clothing.
 ************************************************************/
function completeContinuePhase () {
	/* show the player removing an article of clothing */
	prepareToStripPlayer(recentLoser);
	console.log("Loser strips");
    updateAllGameVisuals();
	
	$mainButton.html("Strip");
    if (players[HUMAN_PLAYER].out && AUTO_FORFEIT) {
        setTimeout(advanceGame,FORFEIT_DELAY);
    }
}

/************************************************************
 * Processes everything required to complete the strip phase
 * of a round. Makes the losing player strip or start their
 * forfeit. May also end the game if only one player remains.
 ************************************************************/
function completeStripPhase () {
    /* strip the player with the lowest hand */
    stripPlayer(recentLoser);
    updateAllGameVisuals();
}

/************************************************************
 * Handles everything that happens at the end of the round.
 * Including the checks for the end of game.
 ************************************************************/
function endRound () {
	/* check to see how many players are still in the game */
    var inGame = 0;
    var lastPlayer = 0;
    for (var i = 0; i < players.length; i++) {
        if (!players[i].out) {
            inGame++;
            lastPlayer = i;
        }
    }
    
    /* if there is only one player left, end the game */
    if (inGame == 1) {
		console.log("The game has ended!");
		$gameBanner.html("Game Over! "+players[lastPlayer].label+" won Strip Poker Night at the Inventory!");
		gameOver = true;
        
        for (var i = 0; i < players.length; i++) {
            if (HUMAN_PLAYER == i) {
                $gamePlayerCardArea.hide();
            } 
            else {
                $gameOpponentAreas[i-1].hide();
            }
        }
        
		handleGameOver();
	} else {
		if(prizeTaken){
			$mainButton.html("Deal");
		} else {
			$mainButton.html("Prize");
		}
        if (players[HUMAN_PLAYER].out && AUTO_FORFEIT) {
            setTimeout(advanceGame,FORFEIT_DELAY);
        }
	}
	$mainButton.attr('disabled', false);
    actualMainButtonState = false;
}

/************************************************************
 * Handles the end of the game. Currently just waits for all
 * players to finish their forfeits.
 ************************************************************/
function handleGameOver() {
	/* determine how many timers are left */
	var left = 0;
	for (var i = 0; i < timers.length; i++) {
		if (timers[i] > 0) {
			left++;
		}
	}
	
	/* determine true end */
	if (left == 0) {
		/* true end */
        updateAllGameVisuals();
        
		$mainButton.html("Restart?");
		$mainButton.attr('disabled', false);
        actualMainButtonState = false;
	} else {
		/* someone is still forfeiting */
		var context = "Wait";
		$mainButton.html("Wait");
		context = tickForfeitTimers(context);
		if (context == "Wait") {
			/* no one finished yet */
			window.setTimeout(handleGameOver, GAME_OVER_DELAY);
		} else {
			/* someone finished, wait for the button */
		}
	}
}
 
/**********************************************************************
 *****                    Interaction Functions                   *****
 **********************************************************************/

/************************************************************
 * The player selected one of their cards.
 ************************************************************/
function selectCard (card) {
	hands[HUMAN_PLAYER].tradeIns[card] = !hands[HUMAN_PLAYER].tradeIns[card];
	
	if (hands[HUMAN_PLAYER].tradeIns[card]) {
		dullCard(HUMAN_PLAYER, card);
	} else {
		fillCard(HUMAN_PLAYER, card);
	}
}
 
/************************************************************
 * The player clicked the advance dialogue button on the main
 * game screen.
 ************************************************************/
function advanceGameDialogue (slot) {
    players[slot].current++;
    
    /* update dialogue */
    $gameDialogues[slot-1].html(players[slot].state[players[slot].current].dialogue);
    
    /* determine if the advance dialogue button should be shown */
    if (players[slot].state.length > players[slot].current+1) {
        $gameAdvanceButtons[slot-1].css({opacity : 1});
    } else {
        $gameAdvanceButtons[slot-1].css({opacity : 0});
    }
    
    /* direct the dialogue bubble */
    if (players[slot].state[players[slot].current].direction) {
        $gameBubbles[slot-1].removeClass();
		$gameBubbles[slot-1].addClass("bordered dialogue-bubble dialogue-"+players[slot].state[players[slot].current].direction);
	} 
    
    /* update image */
    $gameImages[slot-1].attr('src', players[slot].folder + players[slot].state[players[slot].current].image);
}

/************************************************************
 * The player clicked the main button on the game screen.
 ************************************************************/
function advanceGame () {
    var context = $mainButton.html();
    
    /* disable the button to prevent double clicking */
    $mainButton.attr('disabled', true);
    actualMainButtonState = true;
    
    /* lower the timers of everyone who is forfeiting */
    context = tickForfeitTimers(context);
    
    /* handle the game */
    if (context == "Deal") {
        /* dealing the cards */
        if (AUTO_FADE) forceTableVisibility(true);
		if(prizeTaken){
			prizeTaken = false;
		}
        $mainButton.html("Exchange");
        startDealPhase();
    } else if (context == "Exchange") {
        /* exchanging cards */
        if (AUTO_FADE) forceTableVisibility(true);
        $mainButton.html("Reveal");
        completeExchangePhase();
        $mainButton.attr('disabled', false);
        actualMainButtonState = false;
    } else if (context == "Prize") {
		console.log("PRIZE");
		prepareToTakePrize(recentWinner);
		console.log(recentWinner + " takes all");
		$mainButton.attr('disabled', false);
		
		/*if (AUTO_FADE) forceTableVisibility(true);
        $mainButton.html("Reveal");
        completeExchangePhase();
        $mainButton.attr('disabled', false);
        actualMainButtonState = false;*/
	}
	else if (context == "Reveal") {
        /* revealing cards */
        if (AUTO_FADE) forceTableVisibility(true);
        completeRevealPhase();
        $mainButton.attr('disabled', false);
        actualMainButtonState = false;
    } else if (context == "Continue") {
		/* waiting for the loser to strip */
        if (AUTO_FADE) forceTableVisibility(false);
        completeContinuePhase();
		$mainButton.attr('disabled', false);
        actualMainButtonState = false;
	} else if (context == "Strip") {
        /* stripping the loser */
        if (AUTO_FADE) forceTableVisibility(false);
        completeStripPhase();
        $mainButton.attr('disabled', false);
        actualMainButtonState = false;
		if(!prizeTaken){
			$mainButton.html("Prize");
		} else {
			$mainButton.html("Deal");
		}
    } else if (context == "Wait") {
		/* waiting for someone to finish */
        if (AUTO_FADE) forceTableVisibility(false);
		if (!gameOver) {
			$mainButton.html("Deal");
			$mainButton.attr('disabled', false);
            actualMainButtonState = false;
		} else {
			handleGameOver(); //No delay here
            return;
		}
	} else if (context == "Restart?") {
        if (AUTO_FADE) forceTableVisibility(false);
		showRestartModal(); //No delay here
		$mainButton.attr('disabled', false);
        actualMainButtonState = false;
	} else {
        if (AUTO_FADE) forceTableVisibility(true);
        console.log("Invalid main button state: "+context);
    }
    if (players[HUMAN_PLAYER].out && AUTO_FORFEIT && !(timers[HUMAN_PLAYER] == 0 && context == null)) {
        $mainButton.attr('disabled', true);
        //actualMainButtonState = true;
    }
}

/************************************************************
 * The player clicked the home button. Shows the restart modal.
 ************************************************************/
function showRestartModal () {
    $restartModal.modal('show');
}

/************************************************************
 * METHODS BY THOMAS
 ************************************************************/
 
 /************************************************************
 * Congratulate Winner
 ************************************************************/
 
 function prepareToTakePrize (player) {
	 if(recentWinner == HUMAN_PLAYER){
		 console.log("PLAYER WON");
		 $prizeModal = $("#prize-modal");
		 $playerNameArea = $("#player-name-area");
		 
		 showPrizeModal()

	 } else {
		 console.log("PLAYER DIDN'T WIN");
		 $prizeModal = $("#prize-modal");
		 $playerNameArea = $("#player-name-area");
		 
		 pickPrizePlayer();
	 }
 }
 
  function showPrizeModal () {
	
        if (players[HUMAN_PLAYER].out && AUTO_FORFEIT) {
            setTimeout(advanceGame,FORFEIT_DELAY);
        }
	$prizeModal = $("#prize-modal");
	$playerNameArea = $("#players-name-area");
    
    /* clear the area */
    $playerNameArea.html("");
    
    
		for (i = 1; i < players.length; i++) {

		if (!players[i].out) {
			var playerCard =
				"<input type='submit' value='"+players[i].first+"' onclick='selectPlayerToStrip("+i+")'/>";
				
			$playerNameArea.append(playerCard);	
				
		}
		
		
	}
	
    /* disable the strip button */
    $stripButton.attr('disabled', true);
    
    /* display the stripping modal */
    $prizeModal.modal('show');
}

function selectPlayerToStrip (id){
	console.log(id);
	recentLoser = id;
	console.log(players[recentWinner].first + " chose " + players[recentLoser].first + " to strip");

	//recentLoser = id;
}

function closePrizeModal(){
		console.log("cPM");
		prizeTaken = true;

		$mainButton.html("Continue");
}

function pickPrizePlayer(){
	console.log("Pick Prize Player");
	var playerCounter = 0;
	var foundPlayer = false;
	for (var i = 0; i<players.length; i++){
		console.log(i + "/" + players.length);

		if(!players[i].out){
			playerCounter++;
		} 
	}
	
	console.log("Player Counter:" + playerCounter);

	//searchLowestAvailablePlayer
	var foundLowest = false;
	var lowestPlayer = 0;
	
	console.log("Variables Set");

	for (var i = 0; i <players.length; i++){
		if(!players[i].out && !foundLowest){
			//console.log(players[i].name + " is not out.");
			foundLowest = true;
			lowestPlayer = i;
		} 
	console.log("Lowest available player: " + lowestPlayer);

	}
	
	console.log("Lowest available player: " + lowestPlayer);
	
	//console.log("Number of players" + numberOfPlayers);
	selectedPlayer = -1;
	selectedPlayer = getRandomNumber(0, playerCounter-1) + lowestPlayer;
	
	console.log("Selected Player = : " + selectedPlayer + " | " + players[selectedPlayer].first);
	
	while(players[selectedPlayer].out || selectedPlayer == recentWinner){
			selectedPlayer = getRandomNumber(0, playerCounter-1) +lowestPlayer;
			console.log("Changed selected Player = : " + selectedPlayer + " | " + players[selectedPlayer].first);


	}

		
	console.log("chosenPlayer = " + selectedPlayer);
	
	//selectedPlayer = 0;
	
	recentLoser = selectedPlayer;
	
	if(recentWinner == recentLoser){
		recentLoser = playerCounter-1+lowestPlayer;
	}
	console.log(players[recentWinner].first + " chose " + players[recentLoser].first + " to strip");

	prepareToStripPlayer(selectedPlayer);
	prizeTaken=true;
	$mainButton.html("Continue");
	
	
}