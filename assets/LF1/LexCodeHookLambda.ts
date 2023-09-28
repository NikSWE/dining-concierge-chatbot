import {Handler, LexEvent, LexEventSlots, LexResult} from "aws-lambda";
import {LexDialogActionClose} from "aws-lambda/trigger/lex";

const localitiesServiced: Set<string> = new Set<string>([
    'manhattan',
    'brooklyn',
    'queens',
    'bronx',
    'staten island'
]);

const cuisinesAvailable: Set<string> = new Set<string>([
    'italian',
    'indian',
    'mexican'
]);

function getCloseResponse(messageContent: string): LexResult {
    return {
        dialogAction: {
            type: 'Close',
            fulfillmentState: 'Fulfilled',
            message: {
                contentType: 'PlainText',
                content: messageContent
            }
        }
    };
}

function getElicitSlotResponse(
    slotToEllicitName: string,
    messageContent: string,
    currentSlots: LexEventSlots
): LexResult {
    return {
        dialogAction: {
            type: 'ElicitSlot',
            intentName: 'DiningSuggestionsIntent',
            slotToElicit: slotToEllicitName,
            message: {
                contentType: 'PlainText',
                content: messageContent
            },
            slots: {
                Cuisine: currentSlots.Cuisine ? currentSlots.Cuisine : null,
                PhoneNumber: currentSlots.PhoneNumber ? currentSlots.PhoneNumber : null,
                EmailAddress: currentSlots.EmailAddress ? currentSlots.EmailAddress : null,
                BookingTime: currentSlots.BookingTime ? currentSlots.BookingTime : null,
                NumberOfPeople: currentSlots.NumberOfPeople ? currentSlots.NumberOfPeople : null
            }
        }
    }
}

function isValidEmailAddress(emailAddress: string): boolean {
    let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailAddress);
}

function isValidBookingTime(bookingTime: string): boolean {
    return true;
}

abstract class CustomHandler {
    private nextHandler: CustomHandler | null = null;

    setNext(handler: CustomHandler): CustomHandler {
        this.nextHandler = handler;
        return handler;
    }

    abstract handleRequest(event: LexEvent): LexResult | null;

    passRequest(event: LexEvent): LexResult {
        const result = this.handleRequest(event);

        if (!result) {
            if (this.nextHandler) {
                return this.nextHandler.passRequest(event);
            }
        } else {
            return result;
        }

        return getCloseResponse('We have received your request! We will get in touch shortly!');
    }
}

class EllicitPhoneNumberHandler extends CustomHandler {
    handleRequest(event: LexEvent): LexResult | null {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.PhoneNumber) {
            response = getElicitSlotResponse(
                'PhoneNumber',
                'What is a good phone number to reach you?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.PhoneNumber &&
            event.currentIntent.slots.PhoneNumber.length != 10) {
            response = getElicitSlotResponse(
                'PhoneNumber',
                'I am sorry, could you please provide me a valid 10-digit phone number?',
                event.currentIntent.slots
            );
        }

        return response;
    }
}

class EllicitEmailAddressHandler extends CustomHandler {
    handleRequest(event: LexEvent): LexResult | null {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.EmailAddress) {
            response = getElicitSlotResponse(
                'EmailAddress',
                'What email address would you like the reservation to be sent to?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.EmailAddress &&
            !isValidEmailAddress(event.currentIntent.slots.EmailAddress)) {
            response = getElicitSlotResponse(
                'EmailAddress',
                'I am sorry, could you please provide a different email address?',
                event.currentIntent.slots
            );
        }

        return response;
    }
}

class EllicitCuisineHandler extends CustomHandler {
    handleRequest(event: LexEvent): LexResult | null {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.Cuisine) {
            response = getElicitSlotResponse(
                'Cuisine',
                'What cuisine were you thinking?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.Cuisine &&
            !cuisinesAvailable.has(event.currentIntent.slots.Cuisine.toLowerCase())) {
            response = getElicitSlotResponse(
                'Cuisine',
                'I am sorry, we only have Indian, Mexican, and Italian options. What cuisine would you like to try?',
                event.currentIntent.slots
            );
        }

        return response;
    }
}

class EllicitBookingTimeHandler extends CustomHandler {
    handleRequest(event: LexEvent): LexResult | null {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.BookingTime) {
            response = getElicitSlotResponse(
                'BookingTime',
                'When would you like to make a reservation?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.BookingTime &&
            !isValidBookingTime(event.currentIntent.slots.BookingTime)) {
            response = getElicitSlotResponse(
                'BookingTime',
                'I am sorry, could you please provide a valid booking time?',
                event.currentIntent.slots
            );
        }

        return response;
    }
}

class EllicitNumberOfPeopleHandler extends CustomHandler {
    handleRequest(event: LexEvent): LexResult | null {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.NumberOfPeople) {
            response = getElicitSlotResponse(
                'NumberOfPeople',
                'How many people will be dining?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.NumberOfPeople &&
            +event.currentIntent.slots.NumberOfPeople <= 0 &&
            +event.currentIntent.slots.NumberOfPeople > 100) {
            response = getElicitSlotResponse(
                'NumberOfPeople',
                'I am sorry, could you please provide a valid size for the dining party?',
                event.currentIntent.slots
            );
        }

        return response;
    }
}

class GreetingIntentHandler extends CustomHandler {
    handleRequest(event: LexEvent): LexResult | null {
        return getCloseResponse('Hi, how can I help?');
    }
}

class ThankYouIntentHandler extends CustomHandler {
    handleRequest(event: LexEvent): LexResult | null {
        return getCloseResponse('Happy to help!');
    }
}

class DiningSuggestionsIntentHandler extends CustomHandler {
    handleRequest(event: LexEvent): LexResult |  null {
        return null;
    }
}

const greetingIntentHandler = new GreetingIntentHandler();
const thankYouIntentHandler = new ThankYouIntentHandler();
const diningSuggestionIntentHandler = new DiningSuggestionsIntentHandler();

const ellicitPhoneNumberHandler = new EllicitPhoneNumberHandler();
const ellicitEmailAddressHandler = new EllicitEmailAddressHandler();
const ellicitCuisineHandler = new EllicitCuisineHandler();
const ellicitBookingTimeHandler = new EllicitBookingTimeHandler();
const ellicitNumberOfPeopleHandler = new EllicitNumberOfPeopleHandler();

diningSuggestionIntentHandler.setNext(ellicitPhoneNumberHandler);
ellicitPhoneNumberHandler.setNext(ellicitEmailAddressHandler);
ellicitEmailAddressHandler.setNext(ellicitCuisineHandler);
ellicitCuisineHandler.setNext(ellicitBookingTimeHandler);
ellicitBookingTimeHandler.setNext(ellicitNumberOfPeopleHandler);

export const handler: Handler = async function(event: LexEvent): Promise<LexResult> {
    let response: LexResult = getCloseResponse('Sorry, I didn\'t quite catch that');

    if (event.currentIntent.name == 'GreetingIntent') {
        response = greetingIntentHandler.passRequest(event);
    } else if (event.currentIntent.name == 'ThankYouIntent') {
        response = thankYouIntentHandler.passRequest(event);
    } else if (event.currentIntent.name == 'DiningSuggestionsIntent') {
        response = diningSuggestionIntentHandler.passRequest(event);
    }

    return response;
}