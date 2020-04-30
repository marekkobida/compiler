import * as t from 'io-ts';
import * as types from '../../types';

type CompilerMessage = t.TypeOf<typeof types.CompilerMessage>;

type CompilerMessages = t.TypeOf<typeof types.CompilerMessages>;

let messages: CompilerMessages = [];

function addMessage(text: CompilerMessage['text']) {
  messages = [{ date: +new Date(), text }, ...messages];
}

export { CompilerMessage, CompilerMessages, messages };

export default addMessage;
