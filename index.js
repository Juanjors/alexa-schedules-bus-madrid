/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const schedules = require('./schedules.js');

const SKILL_NAME = 'horario autobus';
const MORE_DATA = '¿Quieres saber mas información sobre los siguientes autobuses?';
const MORE_DATA_RESPONSE = 'Los siguientes autobuses son a las: ';
const MORE_DATA_FAIL = 'No tengo datos de autobuses';
const HELP_MESSAGE = 'Te puedo ayudar a saber cuál será el siguiente autobús';
const HELP_REPROMPT = '¿Cómo te puedo ayudar?';
const STOP_MESSAGE = '!Adiós!';
let next_schedule = 'El siguiente autobús pasa a las: ';

let session = {};

const getSchedules = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetHorariosIntent');
  },
  handle(handlerInput) {
    const date = new Date();
    let currentHour = date.getHours() + 1; //Cutre workarond to get the timezone from Spain (Servers are located in Ireland)
    let currentMinute = date.getMinutes();
    const nextBus = getNextBus(date, isWeekend(date) ? schedules.WEEKENDS : schedules.WEEKDAYS);
    function getNextBus(date, schedules) {
      let nextBuses = [];
      schedules.forEach(hora => {
        const timeAndMinutes = hora.split(":");
        let timeSchedule = timeAndMinutes[0];
        let minuteSchedule = timeAndMinutes[1];
        console.log("current", currentHour, "horarios", timeSchedule);
        if (currentHour < timeSchedule || ((currentHour == timeSchedule) && currentMinute < minuteSchedule)) {
          nextBuses.push(`${timeSchedule}:${minuteSchedule}`);
        }
      });
      session.nextBuses = nextBuses.slice();
      session.nextBuses.pop();
      handlerInput.attributesManager.setSessionAttributes(session);
      return nextBuses;
    }

    function isWeekend(date) {
      const day = date.getDay();
      return (day === 6) || (day === 0);
    }
    //if array is empty it means that there are no more buses today
    const buses = (nextBus.length === 0);
    if (buses) next_schedule = "No hay más autobuses para el día de hoy";

    return handlerInput.responseBuilder
      .speak(next_schedule + (!buses ? nextBus[0] : '') + MORE_DATA)
      .reprompt("")
      .withSimpleCard(SKILL_NAME, nextBus[0])
      .getResponse();
  },
};


const HandleMoreInfo = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    console.log("@@@@", slots);
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    let nextBuses = handlerInput.attributesManager.getSessionAttributes();

    console.log("@@@@", slots);
    return handlerInput.responseBuilder
      .speak(MORE_DATA_RESPONSE) //nextBuses ? nextBuses.join(",") : MORE_DATA_FAIL)
      .getResponse();
  },
};


const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .getResponse();
  },
};


const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    getSchedules,
    HelpHandler,
    ExitHandler,
    HandleMoreInfo,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
