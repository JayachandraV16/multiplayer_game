const express = require('express');
const router = express.Router();
const { getRandomQuestions, getQuestionHint } = require('../controllers/questionController');

router.get('/random', getRandomQuestions);
router.post('/hint', getQuestionHint);

module.exports = router;
