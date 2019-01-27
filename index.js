/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const schedules = require('./schedules.js');

const SKILL_NAME = 'horario autobus';
const NEXT_SCHEDULE = 'El siguiente autobús pasa a las: ';
const HELP_MESSAGE = 'Te puedo ayudar a saber cuál será el siguiente autobús';
const HELP_REPROMPT = '¿Cómo te puedo ayudar?';
const STOP_MESSAGE = '!Adiós!';

const getSchedules = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log({ request });
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
        if (currentHour < timeSchedule || ((currentHour == timeSchedule) && currentMinute < minuteSchedule)) {
          nextBuses.push(`${timeSchedule}:${minuteSchedule}`);
        }

      });
      return nextBuses[0];
    }

    function isWeekend(date) {
      const day = date.getDay();
      return (day === 6) || (day === 0);
    }

    return handlerInput.responseBuilder
      .speak(NEXT_SCHEDULE + nextBus)
      .withSimpleCard(SKILL_NAME, nextBus)
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
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_MESSAGE)
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
    FallbackHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
