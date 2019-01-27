/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const horarios = require('./horarios.js');

const SKILL_NAME = 'horario autobus';
const HORARIO_SIGUIENTE = 'El siguiente autobús pasa a las: ';
const HELP_MESSAGE = 'Te puedo ayudar a saber cuál será el siguiente autobús';
const HELP_REPROMPT = '¿Cómo te puedo ayudar?';
const STOP_MESSAGE = '!Adiós!';

const GetHorarios = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log({ request });
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetHorariosIntent');
  },
  handle(handlerInput) {
    const date = new Date();
    let horaActual = date.getHours();
    let minutoActual = date.getMinutes();
    const nextBus = getNextBus(date, isWeekend(date) ? horarios.WEEKENDS : horarios.WEEKDAYS);
    function getNextBus(date, horarios) {
      let nextBuses = [];
      horarios.forEach(hora => {
        const horaYMinutosHorario = hora.split(":");
        let horaHorario = horaYMinutosHorario[0];
        let minutoHorario = horaYMinutosHorario[1];

        if (horaActual < horaHorario || ((horaActual == horaHorario) && minutoActual < minutoHorario)) {
          nextBuses.push(`${horaHorario}:${minutoHorario}`);
        }

      });
      return nextBuses[0];
    }

    function isWeekend(date) {
      const day = date.getDay();
      return (day === 6) || (day === 0);
    }

    return handlerInput.responseBuilder
      .speak(HORARIO_SIGUIENTE + nextBus)
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
    GetHorarios,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
