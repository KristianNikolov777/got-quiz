//jshint esversion: 6
const quizUrl = "https://proto.io/en/jobs/candidate-questions/quiz.json";
const resultsUrl = "https://proto.io/en/jobs/candidate-questions/result.json";
let title;
let description;
let questionsData = [];
let currentQuestionIndex;
let currentQuestionData;
let resultsData = [];
let playerPoints;
let questionPoints;
let totalScore;
let playerResult;

//Initialize app
(function init() {
  resetCounters();
  createStartpage();
})();

function createStartpage() {
  fetch(quizUrl).then((response) => response.json())
  .then((data) => {
    title = data.title;
    description = data.description;
    questionsData = data.questions;
    $(`<div class='start-page'></div>`).appendTo('.container');
    $(`<h1>${title}</h1>`).appendTo('.start-page');
    $(`<p>${description}</p>`).appendTo('.start-page');
    $(`<button type="button" class="btn btn-dark" id="start-quiz">Start Quiz</button>`).appendTo('.start-page');
  })
  .catch((error) => {
    console.log(error);
    alert('Something went wrong.');
  });
}

function printQuestion() {
  currentQuestionData = questionsData[currentQuestionIndex];
  const questionType = currentQuestionData.question_type;
  const answers = currentQuestionData.possible_answers;
  $('.container').empty();
  $(`<div class='card'></div>`).appendTo('.container');
  $(`<img src='${currentQuestionData.img}' class="card-img-top">`).appendTo('.card');
  $(`<h5>${currentQuestionData.title}</h5>`).appendTo('.card');
  // check question type and print the correct input
  if (questionType === 'mutiplechoice-single') {
    answers.forEach(answer => {
      $(`<label class="option"><input name="radio" type="radio" value='${answer.a_id}'>${answer.caption}</label>`).appendTo('.card');
    });
  } else if (questionType === 'mutiplechoice-multiple') {
    answers.forEach(answer => {
      $(`<label class="option"><input name="multiple" type="checkbox" value="${answer.a_id}">${answer.caption}</label>`).appendTo('.card');
    });
  } else {
    $(`<label class="option"><input name="radio" type="radio" value="true">True</label>`).appendTo('.card');
    $(`<label class="option"><input name="radio" type="radio" value="false">False</label>`).appendTo('.card');
  }
  $(`<button id="next-question" class="btn btn-dark btn-border">Submit</button>`).appendTo('.card');
  $(`<button id="try-again" class="btn btn-dark btn-border">Start Over</button>`).appendTo('.card');
}

function validateAnswer() {
  currentQuestionData = questionsData[currentQuestionIndex];
  questionPoints = currentQuestionData.points;
  const correctAnswer = String(currentQuestionData.correct_answer);
  let selectedAnswerElement = $("input[name='radio']:checked");
  let selectedAnswer = selectedAnswerElement.val();
  let selectedAnswers = [];
  let selectedAnswersElements = [];
  $.each($("input[name='multiple']:checked"), function() {
    selectedAnswersElements.push($(this));
    selectedAnswers.push($(this).val());
  });
  if (selectedAnswer || selectedAnswers.length) {
    // disable button so user doesn't select twice
    $("#next-question").attr("disabled", true);
    if (selectedAnswer == correctAnswer || selectedAnswers == correctAnswer) {
      // add styling class to label
      if (selectedAnswer) {
        selectedAnswerElement.parent().addClass('correct');
      } else {
        selectedAnswersElements.forEach(element => {
          element.parent().addClass('correct');
        });
      }
      trackScore();
    } else {
      selectedAnswerElement.parent().addClass('wrong');
      highlightAnswer(selectedAnswersElements);
    }
    currentQuestionIndex++;
    if (currentQuestionIndex === questionsData.length) {
      setTimeout(() => {
        showResults();
      }, 3000);
    } else {
      setTimeout(() => {
        printQuestion();
      }, 3000);
    }
  } else {
    alert('You must select an answer!');
  }
}

// highlights correct answer or answers
function highlightAnswer(selectedAnswersElements) {
  const correctAnswers = questionsData[currentQuestionIndex].correct_answer;
  const typeOfAnswer = typeof correctAnswers;
  switch (typeOfAnswer) {
    case 'boolean':
      let stringValue = String(correctAnswers);
      $(`input[value="${stringValue}"`).parent().addClass('correct');
      break;
    case 'object':
      correctAnswers.forEach(element => {
        $(`input[value="${element}"`).parent().addClass('correct');
      });
      selectedAnswersElements.forEach(element => {
        if (!correctAnswers.includes(Number(element.val()))) {
          element.parent().addClass('wrong');
        }
      });
      break;
    case 'number':
      $(`input[value="${correctAnswers}"`).parent().addClass('correct');
      break;
  }
}

function trackScore() {
  playerPoints += questionPoints;
  return playerPoints;
}

function calculateScore() {
  const maxPoints = questionsData.reduce((acc, question) => acc + question.points, 0);
  totalScore = (playerPoints / maxPoints) * 100;
  return totalScore;
}

function showResults() {
  calculateScore();
  fetch(resultsUrl).then((response) => response.json())
    .then((data) => {
      resultsData = data.results;
    })
    .then(() => {
      for (let i = 0; i < resultsData.length; i++) {
        if (totalScore >= resultsData[i].minpoints && totalScore <= resultsData[i].maxpoints) {
          playerResult = i;
        }
      }
    })
    .then(() => {
      $(".card").empty();
      $(".card").addClass('text-center');
      $(`<img src="${resultsData[playerResult].img}" class="card-img-top">`).appendTo('.card');
      $(`<h2>${totalScore}%<h2>`).appendTo('.card');
      $(`<h3>${resultsData[playerResult].title}</h3>`).appendTo('.card');
      $(`<h5 class="message-spacing">${resultsData[playerResult].message}</h5>`).appendTo('.card');
      $(`<button id="try-again" class="btn btn-dark">Start Over</button>`).appendTo('.card');
    })
    .catch((error) => {
      console.log(error);
      alert('Something went wrong.');
    });
}

function resetCounters() {
  currentQuestionIndex = 0;
  playerPoints = 0;
  totalScore = 0;
}

function startOver() {
  $(".container").empty();
  resetCounters();
  createStartpage();
}

$(".container").on("click", "#start-quiz", () => {
  printQuestion();
});

$(".container").on("click", "#next-question", () => {
  validateAnswer();
});

$(".container").on("click", "#try-again", () => {
  startOver();
});
