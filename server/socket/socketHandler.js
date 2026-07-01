const Question = require('../models/Question');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');
const Inventory = require('../models/Inventory');

// Bot names for multiplayer simulation
const BOT_NAMES = [
  'Aryabhata', 'Chanakya', 'Gargi', 'Kalidasa', 'Mirabai',
  'Birbal', 'Tenali Raman', 'Sushruta', 'Varahamihira', 'Bhaskara',
  'Maitreyi', 'Charaka', 'Ramanujan', 'Kanada', 'Panini'
];

// Dialogue templates for bot discussion phase
const BOT_CHAT_TEMPLATES = {
  defend_wrong: [
    "Sorry everyone, I got that question wrong. That category was tricky!",
    "Ah, my heritage history is a bit rusty. I promise I'm a Sipahi!",
    "That was a hard question. Don't suspect me just because I answered wrong!",
    "Oops, picked the wrong option. Veena vs Sitar confusion."
  ],
  accuse_others: [
    "I suspect {target} is the Chor. Look at their score!",
    "Could {target} be the Chor? They got a question wrong and answered so late.",
    "{target} is acting very suspicious...",
    "My gut says it's {target}."
  ],
  divert_chor: [
    "I think {target} is definitely the Chor. Let's vote them out!",
    "Sipahis, trust me, {target} is the suspect.",
    "{target} is playing a very quiet game. Must be the thief.",
    "I'm a Sipahi. Let's focus on {target}!"
  ],
  general: [
    "This is intense. Who is the Chor?",
    "We need to find the artifact thief before it's too late!",
    "Let's vote together to win this.",
    "Make sure we don't vote out a guard by mistake."
  ]
};

// Rooms storage in-memory
const rooms = {};

// Helper to generate a random 6-character room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper to strip circular references like 'timer' before emitting to clients
const getCleanRoom = (room) => {
  if (!room) return null;
  const { timer, ...cleanRoom } = room;
  return cleanRoom;
};

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create Room
    socket.on('createRoom', async ({ userId, name }) => {
      try {
        const code = generateRoomCode();
        rooms[code] = {
          roomCode: code,
          hostId: socket.id,
          players: [
            {
              id: socket.id,
              userId,
              name,
              role: null,
              score: 0, // Clue tokens
              coinsEarned: 0,
              answeredThisRound: false,
              lastAnswerCorrect: false,
              votedFor: null,
              disconnected: false
            }
          ],
          currentRound: 1,
          questions: [],
          gameState: 'LOBBY', // LOBBY, PLAYING, ROUND_RESULTS, VOTING, RESULTS
          chatMessages: [],
          votes: {},
          timer: null,
          timerVal: 0
        };

        socket.join(code);
        socket.emit('roomCreated', getCleanRoom(rooms[code]));
        console.log(`Room created: ${code} by user ${name}`);
      } catch (err) {
        console.error(err);
        socket.emit('errorMsg', 'Failed to create room.');
      }
    });

    // Join Room
    socket.on('joinRoom', ({ roomCode, userId, name }) => {
      const code = roomCode.toUpperCase();
      const room = rooms[code];

      if (!room) {
        return socket.emit('errorMsg', 'Room not found.');
      }

      if (room.gameState !== 'LOBBY') {
        return socket.emit('errorMsg', 'Game has already started in this room.');
      }

      if (room.players.length >= 6) {
        return socket.emit('errorMsg', 'Room is full (max 6 players).');
      }

      // Check if player is already in room (refresh issue)
      const existingPlayerIndex = room.players.findIndex(p => p.userId === userId);
      if (existingPlayerIndex !== -1) {
        // Update socket id
        room.players[existingPlayerIndex].id = socket.id;
        room.players[existingPlayerIndex].disconnected = false;
      } else {
        room.players.push({
          id: socket.id,
          userId,
          name,
          role: null,
          score: 0,
          coinsEarned: 0,
          answeredThisRound: false,
          lastAnswerCorrect: false,
          votedFor: null,
          disconnected: false
        });
      }

      socket.join(code);
      io.to(code).emit('roomUpdated', getCleanRoom(room));
      console.log(`User ${name} joined room: ${code}`);
    });

    // Add Bot
    socket.on('addBot', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room) return socket.emit('errorMsg', 'Room not found.');
      if (room.hostId !== socket.id) return socket.emit('errorMsg', 'Only the host can add bots.');
      if (room.players.length >= 6) {
        return socket.emit('errorMsg', 'Room is full (max 6 players).');
      }
      if (room.gameState !== 'LOBBY') {
        return socket.emit('errorMsg', 'Cannot add bots after game starts.');
      }

      // Select a bot name that isn't already used
      const existingNames = room.players.map(p => p.name.replace(' (Bot)', ''));
      const availableNames = BOT_NAMES.filter(name => !existingNames.includes(name));
      if (availableNames.length === 0) {
        return socket.emit('errorMsg', 'No more bots available.');
      }
      const botName = availableNames[Math.floor(Math.random() * availableNames.length)];

      const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
      room.players.push({
        id: botId,
        userId: null,
        name: `${botName} (Bot)`,
        role: null,
        score: 0,
        coinsEarned: 0,
        answeredThisRound: false,
        lastAnswerCorrect: false,
        votedFor: null,
        disconnected: false,
        isBot: true
      });

      io.to(roomCode).emit('roomUpdated', getCleanRoom(room));
      console.log(`Bot ${botName} added to room: ${roomCode}`);
    });

    // Kick Player (or remove Bot)
    socket.on('kickPlayer', ({ roomCode, playerId }) => {
      const room = rooms[roomCode];
      if (!room) return socket.emit('errorMsg', 'Room not found.');
      if (room.hostId !== socket.id) return socket.emit('errorMsg', 'Only the host can kick players.');
      if (room.gameState !== 'LOBBY') {
        return socket.emit('errorMsg', 'Cannot kick players after game starts.');
      }

      const playerIndex = room.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return socket.emit('errorMsg', 'Player not found.');

      const player = room.players[playerIndex];
      if (player.id === socket.id) {
        return socket.emit('errorMsg', 'You cannot kick yourself.');
      }

      room.players.splice(playerIndex, 1);
      io.to(roomCode).emit('roomUpdated', getCleanRoom(room));
      
      if (!player.isBot) {
        io.to(player.id).emit('kickedFromRoom');
      }

      console.log(`Player/Bot ${player.name} kicked from room: ${roomCode}`);
    });

    // Start Game
    socket.on('startGame', async ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room) return socket.emit('errorMsg', 'Room not found.');
      if (room.hostId !== socket.id) return socket.emit('errorMsg', 'Only the host can start the game.');
      if (room.players.length < 3) return socket.emit('errorMsg', 'Need at least 3 players to play Chor Sipahi.');

      try {
        // Fetch 3 random questions from database
        const randomQuestions = await Question.aggregate([{ $sample: { size: 3 } }]);
        if (randomQuestions.length < 3) {
          return socket.emit('errorMsg', 'Insufficient questions in database. Please seed first.');
        }

        room.questions = randomQuestions;
        room.currentRound = 1;
        room.gameState = 'PLAYING';

        // Assign roles: 1 Chor, rest Sipahis
        const chorIndex = Math.floor(Math.random() * room.players.length);
        room.players.forEach((player, idx) => {
          player.role = idx === chorIndex ? 'CHOR' : 'SIPAHI';
          player.score = 0;
          player.coinsEarned = 0;
          player.answeredThisRound = false;
          player.votedFor = null;

          // Notify each player of their role privately
          io.to(player.id).emit('roleAssigned', { role: player.role });
        });

        // Start first round
        startRound(roomCode);
      } catch (err) {
        console.error(err);
        socket.emit('errorMsg', 'Failed to start game.');
      }
    });

    // Submit Answer
    socket.on('submitAnswer', ({ roomCode, answer }) => {
      const room = rooms[roomCode];
      if (!room || room.gameState !== 'PLAYING') return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.answeredThisRound) return;

      const currentQuestion = room.questions[room.currentRound - 1];
      const isCorrect = currentQuestion.answer.toLowerCase() === answer.trim().toLowerCase();

      player.answeredThisRound = true;
      player.lastAnswerCorrect = isCorrect;

      if (isCorrect) {
        player.score += 1; // +1 clue token
        player.coinsEarned += 20; // +20 coins
      }

      // Check if all active players have submitted
      const allSubmitted = room.players
        .filter(p => !p.disconnected)
        .every(p => p.answeredThisRound);

      if (allSubmitted) {
        endRound(roomCode);
      } else {
        io.to(roomCode).emit('roomUpdated', getCleanRoom(room));
      }
    });

    // Cast Vote
    socket.on('castVote', ({ roomCode, targetId }) => {
      const room = rooms[roomCode];
      if (!room || room.gameState !== 'VOTING') return;

      const voter = room.players.find(p => p.id === socket.id);
      if (!voter || voter.votedFor) return;

      voter.votedFor = targetId; // Socket ID or null for skip

      // Check if all players have voted
      const allVoted = room.players
        .filter(p => !p.disconnected)
        .every(p => p.votedFor !== null);

      if (allVoted) {
        endVoting(roomCode);
      } else {
        io.to(roomCode).emit('roomUpdated', getCleanRoom(room));
      }
    });

    // Chat Message
    socket.on('sendMessage', ({ roomCode, message }) => {
      const room = rooms[roomCode];
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const chatMsg = {
        sender: player.name,
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      room.chatMessages.push(chatMsg);
      io.to(roomCode).emit('messageReceived', chatMsg);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Find room containing the player
      for (const code in rooms) {
        const room = rooms[code];
        const playerIndex = room.players.findIndex(p => p.id === socket.id);

        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          
          if (room.gameState === 'LOBBY') {
            // Remove player from room
            room.players.splice(playerIndex, 1);
            if (room.players.length === 0) {
              clearInterval(room.timer);
              delete rooms[code];
              console.log(`Room ${code} deleted (empty)`);
            } else {
              // If host left, assign new host
              if (room.hostId === socket.id) {
                room.hostId = room.players[0].id;
              }
              io.to(code).emit('roomUpdated', getCleanRoom(room));
            }
          } else {
            // In game: mark as disconnected
            player.disconnected = true;
            
            // Check if room is empty now
            const activePlayers = room.players.filter(p => !p.disconnected);
            if (activePlayers.length === 0) {
              clearInterval(room.timer);
              delete rooms[code];
              console.log(`Room ${code} deleted (empty during game)`);
            } else {
              // If host left, assign new host
              if (room.hostId === socket.id) {
                room.hostId = activePlayers[0].id;
              }
              
              // Trigger checks in case this was the last person to answer/vote
              if (room.gameState === 'PLAYING') {
                const allSubmitted = room.players
                  .filter(p => !p.disconnected)
                  .every(p => p.answeredThisRound);
                if (allSubmitted) {
                  endRound(code);
                } else {
                  io.to(code).emit('roomUpdated', getCleanRoom(room));
                }
              } else if (room.gameState === 'VOTING') {
                const allVoted = room.players
                  .filter(p => !p.disconnected)
                  .every(p => p.votedFor !== null);
                if (allVoted) {
                  endVoting(code);
                } else {
                  io.to(code).emit('roomUpdated', getCleanRoom(room));
                }
              }
            }
          }
          break;
        }
      }
    });
  });

  // Start round timer and broadcast question
  function startRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.gameState = 'PLAYING';
    room.players.forEach(p => {
      p.answeredThisRound = false;
      p.lastAnswerCorrect = false;
    });

    room.timerVal = 30; // 30 seconds for question
    io.to(roomCode).emit('roundStarted', {
      currentRound: room.currentRound,
      question: {
        category: room.questions[room.currentRound - 1].category,
        question: room.questions[room.currentRound - 1].question,
        options: room.questions[room.currentRound - 1].options,
      },
      timerVal: room.timerVal
    });

    // Broadcast room update to ensure clients see reset answered/status states
    io.to(roomCode).emit('roomUpdated', getCleanRoom(room));

    clearInterval(room.timer);
    room.timer = setInterval(() => {
      room.timerVal -= 1;
      io.to(roomCode).emit('timerUpdate', room.timerVal);

      if (room.timerVal <= 0) {
        clearInterval(room.timer);
        endRound(roomCode);
      }
    }, 1000);

    // Schedule bots' answer submissions
    scheduleBotAnswers(roomCode);
  }

  // End round, show results
  function endRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    clearInterval(room.timer);
    room.gameState = 'ROUND_RESULTS';

    const results = room.players.map(p => ({
      id: p.id,
      name: p.name,
      lastAnswerCorrect: p.lastAnswerCorrect,
      score: p.score,
      answeredThisRound: p.answeredThisRound
    }));

    io.to(roomCode).emit('roundEnded', {
      results,
      correctAnswer: room.questions[room.currentRound - 1].answer
    });

    // Move to next stage after 6 seconds
    setTimeout(() => {
      if (room.currentRound < 3) {
        room.currentRound += 1;
        startRound(roomCode);
      } else {
        startVotingPhase(roomCode);
      }
    }, 6000);
  }

  // Start voting discussion phase
  function startVotingPhase(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.gameState = 'VOTING';
    room.timerVal = 45; // 45 seconds for discussion and voting
    room.players.forEach(p => p.votedFor = null);

    io.to(roomCode).emit('votingStarted', {
      timerVal: room.timerVal
    });

    // Sync room state to reset votes on the client
    io.to(roomCode).emit('roomUpdated', getCleanRoom(room));

    clearInterval(room.timer);
    room.timer = setInterval(() => {
      room.timerVal -= 1;
      io.to(roomCode).emit('timerUpdate', room.timerVal);

      if (room.timerVal <= 0) {
        clearInterval(room.timer);
        endVoting(roomCode);
      }
    }, 1000);

    // Schedule bots' chat messages and votes
    scheduleBotChat(roomCode);
    scheduleBotVotes(roomCode);
  }

  // End voting phase and compute results
  async function endVoting(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    clearInterval(room.timer);
    room.gameState = 'RESULTS';

    // Count votes
    const voteCounts = {}; // targetId -> count
    let maxVotes = 0;
    let votedOutId = null;

    room.players.forEach(p => {
      if (p.votedFor && p.votedFor !== 'skip') {
        voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
        if (voteCounts[p.votedFor] > maxVotes) {
          maxVotes = voteCounts[p.votedFor];
          votedOutId = p.votedFor;
        } else if (voteCounts[p.votedFor] === maxVotes) {
          // Tie, meaning no single majority voted out
          votedOutId = null; 
        }
      }
    });

    const votedOutPlayer = votedOutId ? room.players.find(p => p.id === votedOutId) : null;
    const chorPlayer = room.players.find(p => p.role === 'CHOR');

    let sipahiWin = false;
    if (votedOutPlayer && votedOutPlayer.role === 'CHOR') {
      sipahiWin = true;
    }

    // Award database coins and update stats
    const updatedPlayers = [];
    for (const player of room.players) {
      if (player.userId) {
        try {
          const user = await User.findById(player.userId);
          if (user) {
            // Determine rewards
            let roundCoins = player.coinsEarned;
            let winCoins = 0;
            let winDiamonds = 0;
            const isWinner = (player.role === 'CHOR' && !sipahiWin) || (player.role === 'SIPAHI' && sipahiWin);

            if (isWinner) {
              winCoins = 50;
              winDiamonds = 2;
              user.wins += 1;
            } else {
              winCoins = 10;
            }

            user.coins += (roundCoins + winCoins);
            user.diamonds += winDiamonds;
            await user.save();

            // Sync Inventory
            const inventory = await Inventory.findOne({ userId: user._id });
            if (inventory) {
              inventory.coins = user.coins;
              inventory.diamonds = user.diamonds;
              await inventory.save();
            }

            // Sync Leaderboard
            const leaderboard = await Leaderboard.findOne({ userId: user._id });
            if (leaderboard) {
              leaderboard.wins = user.wins;
              await leaderboard.save();
            }

            updatedPlayers.push({
              id: player.id,
              name: player.name,
              role: player.role,
              clues: player.score,
              coinsEarned: roundCoins + winCoins,
              diamondsEarned: winDiamonds,
              isWinner
            });
          }
        } catch (err) {
          console.error(`Error saving user stats on match end: ${err.message}`);
        }
      }
    }

    io.to(roomCode).emit('gameEnded', {
      sipahiWin,
      votedOutName: votedOutPlayer ? votedOutPlayer.name : 'Nobody (Skip/Tie)',
      chorName: chorPlayer ? chorPlayer.name : 'Unknown',
      playersResults: updatedPlayers
    });

    // Reset room for another game after 10 seconds
    setTimeout(() => {
      if (rooms[roomCode]) {
        rooms[roomCode].gameState = 'LOBBY';
        rooms[roomCode].currentRound = 1;
        rooms[roomCode].questions = [];
        rooms[roomCode].chatMessages = [];
        rooms[roomCode].players.forEach(p => {
          p.role = null;
          p.score = 0;
          p.coinsEarned = 0;
          p.answeredThisRound = false;
          p.votedFor = null;
        });
        io.to(roomCode).emit('roomUpdated', getCleanRoom(rooms[roomCode]));
      }
    }, 12000);
  }

  // Schedule bots to submit answers
  function scheduleBotAnswers(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.gameState !== 'PLAYING') return;

    const bots = room.players.filter(p => p.isBot && !p.disconnected && !p.answeredThisRound);
    if (bots.length === 0) return;

    const currentQuestion = room.questions[room.currentRound - 1];
    if (!currentQuestion) return;

    bots.forEach(bot => {
      // Pick a random delay between 3 and 12 seconds
      const delay = Math.floor(Math.random() * 9000) + 3000;

      setTimeout(() => {
        // Double check room state
        const currentRoom = rooms[roomCode];
        if (!currentRoom || currentRoom.gameState !== 'PLAYING') return;
        const currentBot = currentRoom.players.find(p => p.id === bot.id);
        if (!currentBot || currentBot.answeredThisRound || currentBot.disconnected) return;

        // Determine correctness: Chor 50%, Sipahi 75%
        const rand = Math.random();
        const isCorrect = currentBot.role === 'CHOR' ? rand < 0.50 : rand < 0.75;
        
        let chosenAnswer;
        if (isCorrect) {
          chosenAnswer = currentQuestion.answer;
        } else {
          // Choose an incorrect option
          const incorrectOptions = currentQuestion.options.filter(
            o => o.toLowerCase() !== currentQuestion.answer.toLowerCase()
          );
          chosenAnswer = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
        }

        currentBot.answeredThisRound = true;
        currentBot.lastAnswerCorrect = isCorrect;
        
        if (isCorrect) {
          currentBot.score += 1;
          currentBot.coinsEarned += 20;
        }

        console.log(`Bot ${currentBot.name} submitted answer: ${chosenAnswer} (Correct: ${isCorrect})`);

        // Check if all players have submitted
        const allSubmitted = currentRoom.players
          .filter(p => !p.disconnected)
          .every(p => p.answeredThisRound);

        if (allSubmitted) {
          endRound(roomCode);
        } else {
          io.to(roomCode).emit('roomUpdated', getCleanRoom(currentRoom));
        }
      }, delay);
    });
  }

  // Schedule bots to send chat messages in discussion phase
  function scheduleBotChat(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.gameState !== 'VOTING') return;

    const bots = room.players.filter(p => p.isBot && !p.disconnected);
    if (bots.length === 0) return;

    bots.forEach(bot => {
      // Determine if bot sends a message (e.g. 70% chance of sending a message)
      if (Math.random() > 0.7) return;

      // Pick a random delay between 5 and 30 seconds
      const delay = Math.floor(Math.random() * 25000) + 5000;

      setTimeout(() => {
        const currentRoom = rooms[roomCode];
        if (!currentRoom || currentRoom.gameState !== 'VOTING') return;
        const currentBot = currentRoom.players.find(p => p.id === bot.id);
        if (!currentBot || currentBot.disconnected) return;

        // Choose template based on role and score
        let category = 'general';
        if (currentBot.role === 'CHOR') {
          category = 'divert_chor';
        } else {
          // Sipahi
          if (currentBot.score < 3) {
            // Got some answers wrong
            category = Math.random() < 0.5 ? 'defend_wrong' : 'accuse_others';
          } else {
            category = Math.random() < 0.7 ? 'accuse_others' : 'general';
          }
        }

        const templates = BOT_CHAT_TEMPLATES[category];
        let messageText = templates[Math.floor(Math.random() * templates.length)];

        // If template requires a target, find a suitable player
        if (messageText.includes('{target}')) {
          // Find candidates (excluding the bot itself)
          const candidates = currentRoom.players.filter(p => p.id !== currentBot.id && !p.disconnected);
          if (candidates.length > 0) {
            let targetPlayer;
            if (category === 'accuse_others') {
              // Sipahi bot targets the player with the lowest score
              const sorted = [...candidates].sort((a, b) => a.score - b.score);
              targetPlayer = sorted[0];
            } else {
              targetPlayer = candidates[Math.floor(Math.random() * candidates.length)];
            }
            messageText = messageText.replace('{target}', targetPlayer.name);
          } else {
            // Fallback to general template
            const genTemplates = BOT_CHAT_TEMPLATES.general;
            messageText = genTemplates[Math.floor(Math.random() * genTemplates.length)];
          }
        }

        const chatMsg = {
          sender: currentBot.name,
          text: messageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        currentRoom.chatMessages.push(chatMsg);
        io.to(roomCode).emit('messageReceived', chatMsg);
      }, delay);
    });
  }

  // Schedule bots to cast votes
  function scheduleBotVotes(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.gameState !== 'VOTING') return;

    const bots = room.players.filter(p => p.isBot && !p.disconnected && !p.votedFor);
    if (bots.length === 0) return;

    bots.forEach(bot => {
      // Pick a random delay between 12 and 35 seconds
      const delay = Math.floor(Math.random() * 23000) + 12000;

      setTimeout(() => {
        const currentRoom = rooms[roomCode];
        if (!currentRoom || currentRoom.gameState !== 'VOTING') return;
        const currentBot = currentRoom.players.find(p => p.id === bot.id);
        if (!currentBot || currentBot.votedFor || currentBot.disconnected) return;

        // Choose who to vote for
        const otherPlayers = currentRoom.players.filter(p => p.id !== currentBot.id && !p.disconnected);
        if (otherPlayers.length === 0) return;

        let targetId = 'skip';

        if (currentBot.role === 'CHOR') {
          // Chor bot votes for a random Sipahi player (not themselves)
          const sipahis = otherPlayers.filter(p => p.role !== 'CHOR');
          const target = sipahis.length > 0 ? sipahis[Math.floor(Math.random() * sipahis.length)] : otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          targetId = target.id;
        } else {
          // Sipahi Bot
          // 70% chance to vote for the player with the lowest score, 15% chance to vote for a random other player, 15% chance to skip
          const rand = Math.random();
          if (rand < 0.70) {
            // Sort by score ascending (lowest score is most suspicious)
            const sorted = [...otherPlayers].sort((a, b) => a.score - b.score);
            targetId = sorted[0].id;
          } else if (rand < 0.85) {
            targetId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
          } else {
            targetId = 'skip';
          }
        }

        currentBot.votedFor = targetId;
        console.log(`Bot ${currentBot.name} voted for ${targetId}`);

        // Check if all players have voted
        const allVoted = currentRoom.players
          .filter(p => !p.disconnected)
          .every(p => p.votedFor !== null);

        if (allVoted) {
          endVoting(roomCode);
        } else {
          io.to(roomCode).emit('roomUpdated', getCleanRoom(currentRoom));
        }
      }, delay);
    });
  }
};

module.exports = socketHandler;
