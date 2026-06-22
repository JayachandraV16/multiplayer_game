import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext, API_URL } from '../context/AuthContext';
import { Heart, Coins, Gem, Zap, Shield, Play, RotateCcw } from 'lucide-react';

// Map grids: 1 = wall, 0 = path + coin, 2 = memory fragment, 3 = diamond, 9 = empty path
const MAPS = {
  stepwell: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,2,1],
    [1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,1,1,9,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,1,9,9,9,9,9,1,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,9,1,1,1,9,1,0,1,0,1,1,1],
    [9,9,1,0,0,0,1,9,1,9,1,9,1,0,0,0,1,9,9],
    [1,1,1,0,1,0,1,9,1,1,1,9,1,0,1,0,1,1,1],
    [1,0,0,0,1,0,1,9,9,9,9,9,1,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,3,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1],
    [1,2,0,0,0,0,1,0,0,2,0,0,1,0,0,0,0,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  fort: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,9,1,9,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,9,9,9,9,9,9,9,1,0,1,1,1,1],
    [1,2,0,0,0,1,0,1,1,1,1,1,0,1,0,0,0,2,1],
    [1,0,1,1,0,1,0,0,0,3,0,0,0,1,0,1,1,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  mandala: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,1,0,0,0,0,2,0,0,0,0,1,0,0,2,1],
    [1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,1,9,9,9,9,9,1,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,9,1,1,1,9,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,9,9,1,3,1,9,9,0,1,0,0,0,1],
    [1,1,1,0,1,1,1,9,1,9,1,9,1,1,1,0,1,1,1],
    [1,2,0,0,0,0,1,9,9,9,9,9,1,0,0,0,0,2,1],
    [1,1,1,0,1,1,1,9,1,9,1,9,1,1,1,0,1,1,1],
    [1,0,0,0,1,0,9,9,1,9,1,9,9,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,9,1,1,1,9,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,1,9,9,9,9,9,1,0,0,0,1,0,1],
    [1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1],
    [1,2,0,0,1,0,0,0,0,2,0,0,0,0,1,0,0,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
};

// Skin styling helper
const getSkinProperties = (skinId) => {
  switch (skinId) {
    case 'mauryan_warrior':
      return { color: '#ef4444', innerColor: '#991b1b', name: 'Mauryan Warrior', glow: 'rgba(239, 68, 68, 0.6)' };
    case 'gupta_scholar':
      return { color: '#3b82f6', innerColor: '#1e40af', name: 'Gupta Scholar', glow: 'rgba(59, 130, 246, 0.6)' };
    case 'chola_voyager':
      return { color: '#06b6d4', innerColor: '#0891b2', name: 'Chola Voyager', glow: 'rgba(6, 182, 212, 0.6)' };
    case 'gold_sutradhar':
      return { color: '#fbbf24', innerColor: '#d97706', name: 'Golden Sutradhar', glow: 'rgba(251, 191, 36, 0.9)' };
    default:
      return { color: '#f97316', innerColor: '#c2410c', name: 'Sutradhar Classic', glow: 'rgba(249, 115, 22, 0.5)' };
  }
};

const SutradharMaze = ({ onBackToDashboard }) => {
  const canvasRef = useRef(null);
  const { user, refreshUser } = useContext(AuthContext);

  const [mapTheme, setMapTheme] = useState('stepwell'); // stepwell, fort, mandala
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [diamondsEarned, setDiamondsEarned] = useState(0);
  const [fragmentsCollected, setFragmentsCollected] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);

  // Question overlay state
  const [questionModal, setQuestionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(15);
  const [questionFeedback, setQuestionFeedback] = useState(null);

  // Speed and shield status
  const [speedBoost, setSpeedBoost] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);

  // Game coordinates ref for animation loop
  const gameStateRef = useRef({
    player: { x: 1, y: 1, dx: 0, dy: 0, targetX: 1, targetY: 1, speed: 0.1 },
    ghosts: [
      { x: 9, y: 5, color: '#ec4899', dx: 0, dy: 0, targetX: 9, targetY: 5, speed: 0.04 },
      { x: 9, y: 9, color: '#a855f7', dx: 0, dy: 0, targetX: 9, targetY: 9, speed: 0.05 },
      { x: 9, y: 7, color: '#10b981', dx: 0, dy: 0, targetX: 9, targetY: 7, speed: 0.045 }
    ],
    grid: [],
    invincibilityTimer: 0,
    activeKeys: {}
  });

  const questionTimerInterval = useRef(null);

  // Initialize/Reset grid data when mapTheme changes
  useEffect(() => {
    resetGameData();
  }, [mapTheme]);

  const resetGameData = () => {
    // Clone map grid
    gameStateRef.current.grid = JSON.parse(JSON.stringify(MAPS[mapTheme]));
    gameStateRef.current.player = { x: 1, y: 1, dx: 0, dy: 0, targetX: 1, targetY: 1, speed: 0.1 };
    
    // Ghost starting coordinates depend on theme (empty center)
    gameStateRef.current.ghosts = [
      { x: 9, y: 4, color: '#ec4899', targetX: 9, targetY: 4, speed: 0.035, baseSpeed: 0.035 },
      { x: 9, y: 8, color: '#a855f7', targetX: 9, targetY: 8, speed: 0.045, baseSpeed: 0.045 },
      { x: 9, y: 6, color: '#10b981', targetX: 9, targetY: 6, speed: 0.04, baseSpeed: 0.04 }
    ];
    gameStateRef.current.invincibilityTimer = 0;
    
    setScore(0);
    setCoinsEarned(0);
    setDiamondsEarned(0);
    setFragmentsCollected(0);
    setHearts(5);
    setIsGameOver(false);
    setIsGameWon(false);
    setSpeedBoost(false);
    setShieldActive(false);
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying || questionModal || isGameOver || isGameWon) return;
      gameStateRef.current.activeKeys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      delete gameStateRef.current.activeKeys[e.key];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, questionModal, isGameOver, isGameWon]);

  // Main Canvas Rendering & Animation Loop
  useEffect(() => {
    if (!isPlaying || questionModal || isGameOver || isGameWon) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    const TILE_SIZE = 32;
    const playerStyle = getSkinProperties(user?.activeSkin || 'default');

    const update = () => {
      const state = gameStateRef.current;
      const player = state.player;
      
      // Decelerate invincibility
      if (state.invincibilityTimer > 0) {
        state.invincibilityTimer--;
      }

      // 1. Handle Player Movement towards grid target
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      
      // If player reached target grid cell, read next keyboard input
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        player.x = player.targetX;
        player.y = player.targetY;
        
        let nextDx = 0;
        let nextDy = 0;

        if (state.activeKeys['ArrowUp'] || state.activeKeys['w'] || state.activeKeys['W']) {
          nextDy = -1;
        } else if (state.activeKeys['ArrowDown'] || state.activeKeys['s'] || state.activeKeys['S']) {
          nextDy = 1;
        } else if (state.activeKeys['ArrowLeft'] || state.activeKeys['a'] || state.activeKeys['A']) {
          nextDx = -1;
        } else if (state.activeKeys['ArrowRight'] || state.activeKeys['d'] || state.activeKeys['D']) {
          nextDx = 1;
        }

        if (nextDx !== 0 || nextDy !== 0) {
          const nextGridX = player.x + nextDx;
          const nextGridY = player.y + nextDy;
          
          // Check collision with wall
          if (state.grid[nextGridY] && state.grid[nextGridY][nextGridX] !== 1) {
            player.targetX = nextGridX;
            player.targetY = nextGridY;
          }
        }
      } else {
        // Linearly move player to target
        const currentSpeed = speedBoost ? player.speed * 1.5 : player.speed;
        player.x += Math.sign(dx) * currentSpeed;
        player.y += Math.sign(dy) * currentSpeed;
      }

      // Check current cell collections
      const currentGridX = Math.round(player.x);
      const currentGridY = Math.round(player.y);
      const cellValue = state.grid[currentGridY] ? state.grid[currentGridY][currentGridX] : 1;

      if (cellValue === 0) {
        // Collect Coin
        state.grid[currentGridY][currentGridX] = 9; // set empty
        setScore(prev => prev + 10);
        setCoinsEarned(prev => prev + 1);
      } else if (cellValue === 2) {
        // Collect Memory Fragment
        state.grid[currentGridY][currentGridX] = 9;
        setScore(prev => prev + 50);
        setFragmentsCollected(prev => {
          const newVal = prev + 1;
          if (newVal > 0 && newVal % 10 === 0) {
            // Trigger Heritage Trivia
            triggerTriviaQuestion();
          }
          return newVal;
        });
      } else if (cellValue === 3) {
        // Collect Diamond
        state.grid[currentGridY][currentGridX] = 9;
        setScore(prev => prev + 150);
        setDiamondsEarned(prev => prev + 1);
      }

      // Check if all collectables are gathered (win condition)
      let itemsLeft = false;
      for (let r = 0; r < state.grid.length; r++) {
        for (let c = 0; c < state.grid[r].length; c++) {
          if (state.grid[r][c] === 0 || state.grid[r][c] === 2 || state.grid[r][c] === 3) {
            itemsLeft = true;
            break;
          }
        }
      }
      if (!itemsLeft) {
        setIsGameWon(true);
        handleGameOverSubmit(true);
        return;
      }

      // 2. Handle Ghosts (Vismarana) AI
      state.ghosts.forEach(ghost => {
        const gDx = ghost.targetX - ghost.x;
        const gDy = ghost.targetY - ghost.y;

        if (Math.abs(gDx) < 0.01 && Math.abs(gDy) < 0.01) {
          ghost.x = ghost.targetX;
          ghost.y = ghost.targetY;

          // Simple Pathfinding: head towards player's position
          const possibleDirs = [];
          const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 0 }   // Right
          ];

          directions.forEach(dir => {
            const nextX = ghost.x + dir.dx;
            const nextY = ghost.y + dir.dy;
            if (state.grid[nextY] && state.grid[nextY][nextX] !== 1) {
              possibleDirs.push(dir);
            }
          });

          if (possibleDirs.length > 0) {
            // Choose the direction that minimizes distance to player
            let bestDir = possibleDirs[0];
            let minDist = Infinity;

            possibleDirs.forEach(dir => {
              const testX = ghost.x + dir.dx;
              const testY = ghost.y + dir.dy;
              const dist = Math.pow(testX - player.x, 2) + Math.pow(testY - player.y, 2);
              if (dist < minDist) {
                minDist = dist;
                bestDir = dir;
              }
            });

            // Random variation to make movement less deterministic and more natural (15% chance)
            if (Math.random() < 0.15) {
              bestDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            }

            ghost.targetX = ghost.x + bestDir.dx;
            ghost.targetY = ghost.y + bestDir.dy;
          }
        } else {
          ghost.x += Math.sign(gDx) * ghost.speed;
          ghost.y += Math.sign(gDy) * ghost.speed;
        }

        // 3. Collision Check: Player and Ghost
        const distanceToPlayer = Math.sqrt(Math.pow(player.x - ghost.x, 2) + Math.pow(player.y - ghost.y, 2));
        if (distanceToPlayer < 0.7 && state.invincibilityTimer === 0) {
          if (shieldActive) {
            // Spend shield
            setShieldActive(false);
            state.invincibilityTimer = 60; // 1 second invincibility
          } else {
            // Deduct Heart
            setHearts(prev => {
              const newHearts = prev - 1;
              if (newHearts <= 0) {
                setIsGameOver(true);
                handleGameOverSubmit(false);
              }
              return newHearts;
            });
            
            // Teleport player back to start
            player.x = 1;
            player.y = 1;
            player.targetX = 1;
            player.targetY = 1;
            
            state.invincibilityTimer = 90; // 1.5 seconds invincibility
          }
        }
      });
    };

    const draw = () => {
      const state = gameStateRef.current;
      const player = state.player;

      // Clear canvas
      ctx.fillStyle = '#0a0405'; // Deep Maroon dark
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      for (let r = 0; r < state.grid.length; r++) {
        for (let c = 0; c < state.grid[r].length; c++) {
          const tile = state.grid[r][c];
          
          if (tile === 1) {
            // Wall color depends on theme
            if (mapTheme === 'stepwell') {
              ctx.fillStyle = '#0f2042'; // Royal Blue Wall
              ctx.strokeStyle = 'rgba(212,175,55,0.4)'; // Gold accent outline
            } else if (mapTheme === 'fort') {
              ctx.fillStyle = '#3d1418'; // Fort Dark Red
              ctx.strokeStyle = 'rgba(212,175,55,0.3)';
            } else {
              ctx.fillStyle = '#1c356e'; // Mandala Blue
              ctx.strokeStyle = '#d4af37';
            }
            
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.lineWidth = 1;
            ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          } else if (tile === 0) {
            // Coins
            ctx.beginPath();
            ctx.arc(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#d4af37'; // gold
            ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
          } else if (tile === 2) {
            // Memory Fragment (Heritage parchment scroll)
            ctx.fillStyle = '#ded5b8'; // parchment
            ctx.fillRect(c * TILE_SIZE + 10, r * TILE_SIZE + 6, 12, 20);
            
            // Draw ribbons on scrolls
            ctx.fillStyle = '#b8901c'; // gold-dark ribbon
            ctx.fillRect(c * TILE_SIZE + 10, r * TILE_SIZE + 14, 12, 4);
          } else if (tile === 3) {
            // Diamond
            ctx.beginPath();
            ctx.moveTo(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + 8);
            ctx.lineTo(c * TILE_SIZE + TILE_SIZE - 8, r * TILE_SIZE + TILE_SIZE/2);
            ctx.lineTo(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE - 8);
            ctx.lineTo(c * TILE_SIZE + 8, r * TILE_SIZE + TILE_SIZE/2);
            ctx.closePath();
            ctx.fillStyle = '#22d3ee'; // Cyan
            ctx.shadowColor = 'rgba(34, 211, 238, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw Player (Sutradhar)
      const px = player.x * TILE_SIZE + TILE_SIZE/2;
      const py = player.y * TILE_SIZE + TILE_SIZE/2;
      const pRadius = 11;
      
      // Draw temporary shield outline
      if (shieldActive) {
        ctx.beginPath();
        ctx.arc(px, py, pRadius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Blink player when invulnerable
      if (state.invincibilityTimer === 0 || Math.floor(state.invincibilityTimer / 4) % 2 === 0) {
        ctx.beginPath();
        ctx.arc(px, py, pRadius, 0, Math.PI*2);
        ctx.fillStyle = playerStyle.color;
        ctx.shadowColor = playerStyle.glow;
        ctx.shadowBlur = speedBoost ? 20 : 10;
        ctx.fill();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI*2);
        ctx.fillStyle = playerStyle.innerColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Saffron tilak symbol on character
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 1, py - 3, 2, 6);
      }

      // Draw Ghosts (Vismarana spirits)
      state.ghosts.forEach(ghost => {
        const gx = ghost.x * TILE_SIZE + TILE_SIZE/2;
        const gy = ghost.y * TILE_SIZE + TILE_SIZE/2;
        
        ctx.beginPath();
        // Floating spirit dome
        ctx.arc(gx, gy - 2, 10, Math.PI, 0, false);
        // Tentacles at the bottom
        ctx.lineTo(gx + 10, gy + 10);
        ctx.lineTo(gx + 6, gy + 7);
        ctx.lineTo(gx + 2, gy + 10);
        ctx.lineTo(gx - 2, gy + 7);
        ctx.lineTo(gx - 6, gy + 10);
        ctx.lineTo(gx - 10, gy + 7);
        ctx.closePath();
        ctx.fillStyle = ghost.color;
        ctx.shadowColor = ghost.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Spirit eyes (pure white glowing dots)
        ctx.beginPath();
        ctx.arc(gx - 4, gy - 2, 2, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });
    };

    const loop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, questionModal, isGameOver, isGameWon, speedBoost, shieldActive, mapTheme]);

  // Fetch Heritage question
  const triggerTriviaQuestion = async () => {
    setIsPlaying(false);
    setSelectedOption(null);
    setQuestionFeedback(null);
    setQuestionTimer(15);
    
    try {
      const res = await axios.get(`${API_URL}/questions/random?count=1`);
      if (res.data.success && res.data.questions.length > 0) {
        setCurrentQuestion(res.data.questions[0]);
        setQuestionModal(true);

        // Start countdown timer
        clearInterval(questionTimerInterval.current);
        questionTimerInterval.current = setInterval(() => {
          setQuestionTimer(prev => {
            if (prev <= 1) {
              clearInterval(questionTimerInterval.current);
              handleTriviaAnswer(null, true); // timeout, counted as wrong
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Error fetching question:', err);
      setIsPlaying(true); // resume if query fails
    }
  };

  const handleTriviaAnswer = (option, isTimeout = false) => {
    clearInterval(questionTimerInterval.current);
    setSelectedOption(option);

    const isCorrect = !isTimeout && option === currentQuestion.answer;
    
    if (isCorrect) {
      setQuestionFeedback('correct');
      setScore(prev => prev + 250);
      setCoinsEarned(prev => prev + 20);
      setSpeedBoost(true);
      setTimeout(() => setSpeedBoost(false), 5000); // 5 sec speed boost
    } else {
      setQuestionFeedback('wrong');
      // Ghosts speed up
      gameStateRef.current.ghosts.forEach(g => g.speed = g.baseSpeed * 1.5);
      setTimeout(() => {
        gameStateRef.current.ghosts.forEach(g => g.speed = g.baseSpeed);
      }, 8000);

      // Lose a heart
      setHearts(prev => {
        const newHearts = prev - 1;
        if (newHearts <= 0) {
          setIsGameOver(true);
          handleGameOverSubmit(false);
        }
        return newHearts;
      });
    }

    // Wait 2.5 seconds to show feedback modal, then resume
    setTimeout(() => {
      setQuestionModal(false);
      setCurrentQuestion(null);
      if (hearts > 0 && !isGameOver && !isGameWon) {
        setIsPlaying(true);
      }
    }, 2500);
  };

  // Submit Game Over stats to backend
  const handleGameOverSubmit = async (won) => {
    setIsPlaying(false);
    try {
      await axios.post(`${API_URL}/user/game-over`, {
        score,
        coinsEarned,
        diamondsEarned,
        didWin: won
      });
      refreshUser();
    } catch (err) {
      console.error('Error saving game over statistics:', err);
    }
  };

  // Revive player by spending 50 coins
  const handleRevive = async () => {
    if ((user?.coins || 0) < 50) return;
    try {
      const res = await axios.post(`${API_URL}/user/revive`);
      if (res.data.success) {
        setHearts(5);
        setIsGameOver(false);
        setIsPlaying(true);
        refreshUser();
      }
    } catch (err) {
      console.error('Error reviving user:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[80vh]">
      {/* 1. Pre-game Configuration Page */}
      {!isPlaying && !isGameOver && !isGameWon && !questionModal && (
        <div className="heritage-card p-8 rounded-lg max-w-lg w-full text-center border gold-border">
          <h2 className="text-3xl text-gold font-display mb-2">Sutradhar's Maze</h2>
          <p className="text-sm text-parchment-dark mb-6 leading-relaxed">
            Lead the Sutradhar through the ancient passages to recover memory fragments. Avoid the <span className="text-pink-500 font-bold">Vismarana</span> (spirits of forgetting). Reclaiming fragments unlocks cultural wisdom questions.
          </p>

          <div className="mb-6">
            <label className="block text-gold font-display text-sm mb-2 text-left">Select Maze Map Theme:</label>
            <div className="grid grid-cols-3 gap-3">
              {['stepwell', 'fort', 'mandala'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setMapTheme(theme)}
                  className={`px-4 py-2 border rounded text-sm font-display capitalize transition-all ${
                    mapTheme === theme
                      ? 'bg-gold text-maroon-dark border-gold font-bold gold-glow'
                      : 'bg-royal-blue-dark text-parchment border-royal-blue-light hover:border-gold'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-maroon-dark border border-maroon-light p-4 rounded text-left mb-6 text-sm">
            <h4 className="text-gold font-display mb-1">Single Player Setup:</h4>
            <div className="flex items-center justify-between py-1 border-b border-maroon-light">
              <span>Hearts available:</span>
              <span className="flex items-center text-red-500 font-bold"><Heart size={14} className="fill-red-500 mr-1" /> {hearts}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-maroon-light">
              <span>Current Skin:</span>
              <span className="text-gold font-semibold capitalize">{getSkinProperties(user?.activeSkin || 'default').name}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Buy Temporary Shield:</span>
              <button
                disabled={shieldActive || (user?.coins || 0) < 25}
                onClick={async () => {
                  try {
                    const res = await axios.post(`${API_URL}/shop/buy-item`, { itemType: 'shield', quantity: 1 });
                    if (res.data.success) {
                      setShieldActive(true);
                      refreshUser();
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="px-2 py-0.5 bg-royal-blue-light border border-gold text-xs text-gold rounded hover:bg-gold hover:text-maroon-dark transition-all disabled:opacity-50"
              >
                {shieldActive ? 'Active' : '25 Coins'}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={onBackToDashboard} className="flex-1 btn-heritage-outline py-2">
              Back
            </button>
            <button
              onClick={() => {
                setIsPlaying(true);
              }}
              className="flex-1 btn-heritage py-2 flex items-center justify-center gap-2"
            >
              <Play size={16} /> Enter Maze
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Game Screen */}
      {(isPlaying || questionModal || isGameOver || isGameWon) && (
        <div className="flex flex-col items-center">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between w-full max-w-[608px] bg-royal-blue-dark border border-royal-blue-light px-4 py-2 rounded-t-lg text-sm mb-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center text-red-500 font-semibold gap-1">
                <Heart size={16} className="fill-red-500" /> {hearts}
              </span>
              <span className="flex items-center text-gold font-semibold gap-1">
                <Coins size={16} /> {coinsEarned}
              </span>
              <span className="flex items-center text-cyan-400 font-semibold gap-1">
                <Gem size={16} /> {diamondsEarned}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {speedBoost && (
                <span className="flex items-center text-yellow-400 font-semibold text-xs gap-0.5 animate-pulse">
                  <Zap size={14} /> Speed
                </span>
              )}
              {shieldActive && (
                <span className="flex items-center text-cyan-400 font-semibold text-xs gap-0.5">
                  <Shield size={14} /> Shield
                </span>
              )}
              <span className="text-parchment-dark text-xs">
                Score: <strong className="text-parchment">{score}</strong>
              </span>
              <span className="text-parchment-dark text-xs">
                Fragments: <strong className="text-gold">{fragmentsCollected}/10</strong>
              </span>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative border-x border-b border-royal-blue-light p-1 bg-[#0a0405] rounded-b-lg shadow-2xl">
            <canvas
              ref={canvasRef}
              width={608}
              height={480}
              className="block rounded bg-[#0a0405]"
            />

            {/* Mobile Controls (Overlayed for Touch input/convenience) */}
            <div className="flex justify-center gap-2 mt-4 md:hidden">
              <div className="grid grid-cols-3 gap-1 w-32">
                <div></div>
                <button
                  onMouseDown={() => { gameStateRef.current.activeKeys['ArrowUp'] = true; }}
                  onMouseUp={() => { delete gameStateRef.current.activeKeys['ArrowUp']; }}
                  className="bg-royal-blue border border-gold text-gold font-bold p-2 text-center rounded active:bg-gold active:text-maroon-dark"
                >
                  ▲
                </button>
                <div></div>
                
                <button
                  onMouseDown={() => { gameStateRef.current.activeKeys['ArrowLeft'] = true; }}
                  onMouseUp={() => { delete gameStateRef.current.activeKeys['ArrowLeft']; }}
                  className="bg-royal-blue border border-gold text-gold font-bold p-2 text-center rounded active:bg-gold active:text-maroon-dark"
                >
                  ◀
                </button>
                <div className="flex items-center justify-center text-xs text-parchment-dark font-display">Keys</div>
                <button
                  onMouseDown={() => { gameStateRef.current.activeKeys['ArrowRight'] = true; }}
                  onMouseUp={() => { delete gameStateRef.current.activeKeys['ArrowRight']; }}
                  className="bg-royal-blue border border-gold text-gold font-bold p-2 text-center rounded active:bg-gold active:text-maroon-dark"
                >
                  ▶
                </button>

                <div></div>
                <button
                  onMouseDown={() => { gameStateRef.current.activeKeys['ArrowDown'] = true; }}
                  onMouseUp={() => { delete gameStateRef.current.activeKeys['ArrowDown']; }}
                  className="bg-royal-blue border border-gold text-gold font-bold p-2 text-center rounded active:bg-gold active:text-maroon-dark"
                >
                  ▼
                </button>
                <div></div>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-parchment-dark mt-2 hidden md:block">
              Controls: Use Arrow Keys or WASD to navigate.
            </p>

            {/* 3. Question Modal Overlay */}
            {questionModal && currentQuestion && (
              <div className="absolute inset-0 bg-maroon-dark/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="flex justify-between items-center w-full max-w-md mb-2">
                  <span className="text-gold font-display text-xs border border-gold/30 px-2 py-0.5 rounded capitalize">
                    {currentQuestion.category.replace('_', ' ')}
                  </span>
                  <span className={`text-sm font-bold font-display px-2 py-0.5 rounded ${questionTimer <= 5 ? 'text-red-500 animate-bounce' : 'text-gold'}`}>
                    Time Left: {questionTimer}s
                  </span>
                </div>

                <h3 className="text-lg text-parchment font-display mb-6 px-4 leading-snug">
                  {currentQuestion.question}
                </h3>

                <div className="grid grid-cols-1 gap-3 w-full max-w-md mb-6">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === opt;
                    const isCorrectOption = opt === currentQuestion.answer;
                    
                    let btnStyle = 'border-royal-blue-light hover:border-gold bg-royal-blue-dark text-parchment';
                    if (questionFeedback) {
                      if (isCorrectOption) btnStyle = 'bg-emerald-800 border-emerald-400 text-white font-bold';
                      else if (isSelected) btnStyle = 'bg-red-800 border-red-400 text-white';
                    } else if (isSelected) {
                      btnStyle = 'border-gold bg-royal-blue text-gold font-semibold';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={questionFeedback !== null}
                        onClick={() => handleTriviaAnswer(opt)}
                        className={`px-4 py-2.5 border rounded text-sm transition-all text-left flex justify-between items-center ${btnStyle}`}
                      >
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {questionFeedback === 'correct' && (
                  <div className="text-emerald-400 font-display font-semibold animate-pulse text-sm">
                    ✓ Deciphered! Speed Boost Activated +20 Coins!
                  </div>
                )}
                {questionFeedback === 'wrong' && (
                  <div className="text-red-400 font-display font-semibold text-sm">
                    ✗ Failed! Heart lost. The Vismarana speed up!
                  </div>
                )}
              </div>
            )}

            {/* 4. Game Over Overlay */}
            {isGameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-10">
                <h3 className="text-4xl text-red-500 font-display font-black mb-1 gold-text-glow">GAME OVER</h3>
                <p className="text-sm text-parchment-dark mb-6">Vismarana has consumed all memories...</p>
                
                <div className="bg-maroon-dark/60 border border-maroon-light p-4 rounded max-w-xs w-full mb-6 text-left text-sm">
                  <div className="flex justify-between py-1 border-b border-maroon-light">
                    <span>Coins Earned:</span>
                    <span className="text-gold font-semibold">+{coinsEarned}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-maroon-light">
                    <span>Diamonds Earned:</span>
                    <span className="text-cyan-400 font-semibold">+{diamondsEarned}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Final Score:</span>
                    <span className="text-white font-bold">{score}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    disabled={(user?.coins || 0) < 50}
                    onClick={handleRevive}
                    className="btn-heritage py-2 w-full flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw size={16} /> Revive for 50 Coins
                  </button>
                  <p className="text-[10px] text-parchment-dark">
                    You currently have <strong className="text-gold">{user?.coins || 0}</strong> coins.
                  </p>
                  <button
                    onClick={() => {
                      resetGameData();
                      onBackToDashboard();
                    }}
                    className="btn-heritage-outline py-2 w-full"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* 5. Game Won Overlay */}
            {isGameWon && (
              <div className="absolute inset-0 bg-maroon-dark/95 flex flex-col items-center justify-center p-6 text-center z-10 border border-gold">
                <h3 className="text-4xl text-gold font-display font-black mb-1 animate-pulse gold-text-glow">VICTORY</h3>
                <p className="text-sm text-emerald-400 font-semibold mb-6">All memories successfully restored!</p>

                <div className="bg-royal-blue-dark border border-gold/30 p-4 rounded max-w-xs w-full mb-6 text-left text-sm">
                  <div className="flex justify-between py-1 border-b border-royal-blue-light">
                    <span>Coins Earned:</span>
                    <span className="text-gold font-semibold">+{coinsEarned}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-royal-blue-light">
                    <span>Diamonds Earned:</span>
                    <span className="text-cyan-400 font-semibold">+{diamondsEarned}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Final Score:</span>
                    <span className="text-white font-bold">{score}</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={() => {
                      resetGameData();
                      setIsPlaying(true);
                    }}
                    className="flex-1 btn-heritage py-2 text-xs"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => {
                      resetGameData();
                      onBackToDashboard();
                    }}
                    className="flex-1 btn-heritage-outline py-2 text-xs"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SutradharMaze;
