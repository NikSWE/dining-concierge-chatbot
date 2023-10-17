import {Handler, LexEvent, LexEventSlots, LexResult} from "aws-lambda";
import {DynamoDB, SQS} from "aws-sdk";
import {SendMessageRequest} from "aws-sdk/clients/sqs";

const sqsClient = new SQS();
const dynamoDBClient = new DynamoDB();

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
                Locality: currentSlots.Locality ? currentSlots.Locality : null,
                Autofill: currentSlots.Autofill ? currentSlots.Autofill : null,
                BookingDate: currentSlots.BookingDate ? currentSlots.BookingDate : null,
                BookingTime: currentSlots.BookingTime ? currentSlots.BookingTime : null,
                NumberOfPeople: currentSlots.NumberOfPeople ? currentSlots.NumberOfPeople : null
            }
        }
    }
}

function getStartOfDay(dateTime: string) {
    const date = new Date(dateTime);

    const day = [
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0'),
        date.getFullYear()
    ].join('/');

    return `${day} 00:00`;
}

function isValidEmailAddress(emailAddress: string): boolean {
    let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailAddress);
}

function isValidBookingTime(bookingDate: string, bookingTime: string): boolean {
    const currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const reservationDate = new Date([bookingDate, bookingTime].join(' '));
    return currentDate <= reservationDate;
}

function isValidBookingDate(bookingDate: string): boolean {
    const reservationDate = new Date(bookingDate);
    const currentDate = new Date(getStartOfDay(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })));
    return currentDate <= reservationDate;
}

function isValidAutofillChoice(autofillChoice: string) {
    return autofillChoice.toLowerCase() == 'yes' || autofillChoice.toLowerCase() == 'no';
}

async function enqueueSqs(event: LexEvent) {
    const params: SendMessageRequest = {
        MessageBody: 'Suggestion Request',
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/132900788542/SuggestionRequestQueue',
        MessageAttributes: {
            'PhoneNumber': {
                StringValue: event.currentIntent.slots.PhoneNumber ? event.currentIntent.slots.PhoneNumber : '',
                DataType: 'String'
            },
            'EmailAddress': {
                StringValue: event.currentIntent.slots.EmailAddress ? event.currentIntent.slots.EmailAddress : '',
                DataType: 'String'
            },
            'Cuisine': {
                StringValue: event.currentIntent.slots.Cuisine ? event.currentIntent.slots.Cuisine : '',
                DataType: 'String'
            },
            'BookingTime': {
                StringValue: event.currentIntent.slots.BookingTime ? event.currentIntent.slots.BookingTime : '',
                DataType: 'String'
            },
            'BookingDate': {
                StringValue: event.currentIntent.slots.BookingDate ? event.currentIntent.slots.BookingDate : '',
                DataType: 'String'
            },
            'NumberOfPeople': {
                StringValue: event.currentIntent.slots.NumberOfPeople ? event.currentIntent.slots.NumberOfPeople : '',
                DataType: 'String'
            }
        }
    }

    try {
        const response = await sqsClient.sendMessage(params).promise();
        console.log('Response: ', response);
    } catch (error) {
        console.error('Error: ', error);
    }
}

async function storeUserInformation(event: LexEvent) {
    try {
        const response = await dynamoDBClient.putItem({
            Item: {
                'PhoneNumber': {
                    S: event.currentIntent.slots.PhoneNumber!
                },
                'Cuisine': {
                    S: event.currentIntent.slots.Cuisine!
                },
                'EmailAddress': {
                    S: event.currentIntent.slots.EmailAddress!
                },
                'Locality': {
                    S: event.currentIntent.slots.Locality!
                }
            },
            TableName: 'UserInformation'
        }).promise();
    } catch (error) {
        console.error('Error: ', error);
    }
}

abstract class CustomHandler {
    private nextHandler: CustomHandler | null = null;

    setNext(handler: CustomHandler): CustomHandler {
        this.nextHandler = handler;
        return handler;
    }

    abstract handleRequest(event: LexEvent): Promise<LexResult | null>;

    async passRequest(event: LexEvent): Promise<LexResult> {
        const result = await this.handleRequest(event);

        if (!result) {
            if (this.nextHandler) {
                return await this.nextHandler.passRequest(event);
            }
        } else {
            return result;
        }

        await storeUserInformation(event);
        await enqueueSqs(event);

        return Promise.resolve(getCloseResponse('We have received your request! We will get in touch shortly!'));
    }
}

class AutofillInformationHandler extends CustomHandler {
    async handleRequest(event: LexEvent): Promise<LexResult | null> {
        let response: LexResult | null = null;

        const userInformation = await dynamoDBClient.getItem({
            TableName: 'UserInformation',
            Key: {
                'PhoneNumber': {
                    S: event.currentIntent.slots.PhoneNumber!
                }
            }
        }).promise();

        console.log(userInformation.Item);

        if (userInformation.Item) {
            if (!event.currentIntent.slots.Autofill) {
                response = getElicitSlotResponse(
                    'Autofill',
                    'Welcome back, would you like to autofill your basic information?',
                    event.currentIntent.slots
                );
            } else if (event.currentIntent.slots.Autofill &&
                !isValidAutofillChoice(event.currentIntent.slots.Autofill)) {
                response = getElicitSlotResponse(
                    'Autofill',
                    'Sorry, please respond yes or no. Would you like to autofill your basic information?',
                    event.currentIntent.slots
                )
            } else if (event.currentIntent.slots.Autofill.toLowerCase() == 'yes') {
                event.currentIntent.slots.EmailAddress = userInformation.Item.EmailAddress.S;
                event.currentIntent.slots.Locality = userInformation.Item.Locality.S;
                event.currentIntent.slots.Cuisine = userInformation.Item.Cuisine.S;
            }
        }

        return Promise.resolve(response);
    }
}

class EllicitLocalityHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.Locality) {
            response = getElicitSlotResponse(
                'Locality',
                'What borough would you like to dine in?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.Locality &&
            !localitiesServiced.has(event.currentIntent.slots.Locality.toLowerCase())) {
            response = getElicitSlotResponse(
                'Locality',
                'Sorry, we only service the five boroughs of New York City. Please provide a valid burough.',
                event.currentIntent.slots
            );
        }

        return Promise.resolve(response);
    }
}

class EllicitPhoneNumberHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
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

        return Promise.resolve(response);
    }
}

class EllicitEmailAddressHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
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

        return Promise.resolve(response);
    }
}

class EllicitCuisineHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
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

        return Promise.resolve(response);
    }
}

class EllicitBookingTimeHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.BookingTime) {
            response = getElicitSlotResponse(
                'BookingTime',
                'What time would you like to make a reservation?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.BookingTime && event.currentIntent.slots.BookingDate &&
            !isValidBookingTime(event.currentIntent.slots.BookingDate, event.currentIntent.slots.BookingTime)) {
            response = getElicitSlotResponse(
                'BookingTime',
                'I am sorry, we can only make reservations in the future. Could you please provide a valid booking time?',
                event.currentIntent.slots
            );
        }

        return Promise.resolve(response);
    }
}

class EllicitBookingDateHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.BookingDate) {
            response = getElicitSlotResponse(
                'BookingDate',
                'What date would you like to make a reservation for?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.BookingDate &&
                !isValidBookingDate(event.currentIntent.slots.BookingDate)) {
            response = getElicitSlotResponse(
                'BookingDate',
                'Sorry, we can only make reservations for the future. Please provide a valid date.',
                event.currentIntent.slots
            );
        }

        return Promise.resolve(response);
    }
}

class EllicitNumberOfPeopleHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
        let response: LexResult | null = null;

        if (!event.currentIntent.slots.NumberOfPeople) {
            response = getElicitSlotResponse(
                'NumberOfPeople',
                'How many people will be dining?',
                event.currentIntent.slots
            );
        } else if (event.currentIntent.slots.NumberOfPeople &&
            (+event.currentIntent.slots.NumberOfPeople <= 0 ||
            +event.currentIntent.slots.NumberOfPeople > 100)) {
            response = getElicitSlotResponse(
                'NumberOfPeople',
                'I am sorry, could you please provide a valid size for the dining party?',
                event.currentIntent.slots
            );
        }

        return Promise.resolve(response);
    }
}

class GreetingIntentHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
        return Promise.resolve(getCloseResponse('Hi, how can I help?'));
    }
}

class ThankYouIntentHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult | null> {
        return Promise.resolve(getCloseResponse('Happy to help!'));
    }
}

class DiningSuggestionsIntentHandler extends CustomHandler {
    handleRequest(event: LexEvent): Promise<LexResult |  null> {
        return Promise.resolve(null);
    }
}

const greetingIntentHandler = new GreetingIntentHandler();
const thankYouIntentHandler = new ThankYouIntentHandler();
const diningSuggestionIntentHandler = new DiningSuggestionsIntentHandler();

const ellicitPhoneNumberHandler = new EllicitPhoneNumberHandler();
const ellicitEmailAddressHandler = new EllicitEmailAddressHandler();
const ellicitLocalityHandler = new EllicitLocalityHandler();
const ellicitCuisineHandler = new EllicitCuisineHandler();
const ellicitBookingTimeHandler = new EllicitBookingTimeHandler();
const ellicitBookingDateHandler = new EllicitBookingDateHandler();
const ellicitNumberOfPeopleHandler = new EllicitNumberOfPeopleHandler();
const autofillInformationHandler = new AutofillInformationHandler();

diningSuggestionIntentHandler.setNext(ellicitPhoneNumberHandler);
ellicitPhoneNumberHandler.setNext(autofillInformationHandler);
autofillInformationHandler.setNext(ellicitEmailAddressHandler);
ellicitEmailAddressHandler.setNext(ellicitLocalityHandler);
ellicitLocalityHandler.setNext(ellicitCuisineHandler);
ellicitCuisineHandler.setNext(ellicitBookingDateHandler);
ellicitBookingDateHandler.setNext(ellicitBookingTimeHandler);
ellicitBookingTimeHandler.setNext(ellicitNumberOfPeopleHandler);

export const handler: Handler = async function(event: LexEvent): Promise<LexResult> {
    let response: LexResult = getCloseResponse('Sorry, I didn\'t quite catch that');

    if (event.currentIntent.name == 'GreetingIntent') {
        response = await greetingIntentHandler.passRequest(event);
    } else if (event.currentIntent.name == 'ThankYouIntent') {
        response = await thankYouIntentHandler.passRequest(event);
    } else if (event.currentIntent.name == 'DiningSuggestionsIntent') {
        response = await diningSuggestionIntentHandler.passRequest(event);
    }

    return response;
}