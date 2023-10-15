"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var aws_sdk_1 = require("aws-sdk");
var localitiesServiced = new Set([
    'manhattan',
    'brooklyn',
    'queens',
    'bronx',
    'staten island'
]);
var cuisinesAvailable = new Set([
    'italian',
    'indian',
    'mexican'
]);
function getCloseResponse(messageContent) {
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
function getElicitSlotResponse(slotToEllicitName, messageContent, currentSlots) {
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
                BookingDate: currentSlots.BookingDate ? currentSlots.BookingDate : null,
                BookingTime: currentSlots.BookingTime ? currentSlots.BookingTime : null,
                NumberOfPeople: currentSlots.NumberOfPeople ? currentSlots.NumberOfPeople : null
            }
        }
    };
}
function getStartOfDay(dateTime) {
    var date = new Date(dateTime);
    var day = [
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0'),
        date.getFullYear()
    ].join('/');
    return "".concat(day, " 00:00");
}
function isValidEmailAddress(emailAddress) {
    var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailAddress);
}
function isValidBookingTime(bookingDate, bookingTime) {
    var currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    var reservationDate = new Date([bookingDate, bookingTime].join(' '));
    return currentDate <= reservationDate;
}
function isValidBookingDate(bookingDate) {
    var reservationDate = new Date(bookingDate);
    var currentDate = new Date(getStartOfDay(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })));
    return currentDate <= reservationDate;
}
function enqueueSqs(event) {
    return __awaiter(this, void 0, void 0, function () {
        var sqsClient, params, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sqsClient = new aws_sdk_1.SQS();
                    params = {
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
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, sqsClient.sendMessage(params).promise()];
                case 2:
                    response = _a.sent();
                    console.log('Response: ', response);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error: ', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
var CustomHandler = /** @class */ (function () {
    function CustomHandler() {
        this.nextHandler = null;
    }
    CustomHandler.prototype.setNext = function (handler) {
        this.nextHandler = handler;
        return handler;
    };
    CustomHandler.prototype.passRequest = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = this.handleRequest(event);
                        if (!result) {
                            if (this.nextHandler) {
                                return [2 /*return*/, this.nextHandler.passRequest(event)];
                            }
                        }
                        else {
                            return [2 /*return*/, result];
                        }
                        return [4 /*yield*/, enqueueSqs(event)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, getCloseResponse('We have received your request! We will get in touch shortly!')];
                }
            });
        });
    };
    return CustomHandler;
}());
var EllicitLocalityHandler = /** @class */ (function (_super) {
    __extends(EllicitLocalityHandler, _super);
    function EllicitLocalityHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EllicitLocalityHandler.prototype.handleRequest = function (event) {
        var response = null;
        if (!event.currentIntent.slots.Locality) {
            response = getElicitSlotResponse('Locality', 'What borough would you like to dine in?', event.currentIntent.slots);
        }
        else if (event.currentIntent.slots.Locality &&
            !localitiesServiced.has(event.currentIntent.slots.Locality.toLowerCase())) {
            response = getElicitSlotResponse('Locality', 'Sorry, we only service the five boroughs of New York City. Please provide a valid burough.', event.currentIntent.slots);
        }
        return response;
    };
    return EllicitLocalityHandler;
}(CustomHandler));
var EllicitPhoneNumberHandler = /** @class */ (function (_super) {
    __extends(EllicitPhoneNumberHandler, _super);
    function EllicitPhoneNumberHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EllicitPhoneNumberHandler.prototype.handleRequest = function (event) {
        var response = null;
        if (!event.currentIntent.slots.PhoneNumber) {
            response = getElicitSlotResponse('PhoneNumber', 'What is a good phone number to reach you?', event.currentIntent.slots);
        }
        else if (event.currentIntent.slots.PhoneNumber &&
            event.currentIntent.slots.PhoneNumber.length != 10) {
            response = getElicitSlotResponse('PhoneNumber', 'I am sorry, could you please provide me a valid 10-digit phone number?', event.currentIntent.slots);
        }
        return response;
    };
    return EllicitPhoneNumberHandler;
}(CustomHandler));
var EllicitEmailAddressHandler = /** @class */ (function (_super) {
    __extends(EllicitEmailAddressHandler, _super);
    function EllicitEmailAddressHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EllicitEmailAddressHandler.prototype.handleRequest = function (event) {
        var response = null;
        if (!event.currentIntent.slots.EmailAddress) {
            response = getElicitSlotResponse('EmailAddress', 'What email address would you like the reservation to be sent to?', event.currentIntent.slots);
        }
        else if (event.currentIntent.slots.EmailAddress &&
            !isValidEmailAddress(event.currentIntent.slots.EmailAddress)) {
            response = getElicitSlotResponse('EmailAddress', 'I am sorry, could you please provide a different email address?', event.currentIntent.slots);
        }
        return response;
    };
    return EllicitEmailAddressHandler;
}(CustomHandler));
var EllicitCuisineHandler = /** @class */ (function (_super) {
    __extends(EllicitCuisineHandler, _super);
    function EllicitCuisineHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EllicitCuisineHandler.prototype.handleRequest = function (event) {
        var response = null;
        if (!event.currentIntent.slots.Cuisine) {
            response = getElicitSlotResponse('Cuisine', 'What cuisine were you thinking?', event.currentIntent.slots);
        }
        else if (event.currentIntent.slots.Cuisine &&
            !cuisinesAvailable.has(event.currentIntent.slots.Cuisine.toLowerCase())) {
            response = getElicitSlotResponse('Cuisine', 'I am sorry, we only have Indian, Mexican, and Italian options. What cuisine would you like to try?', event.currentIntent.slots);
        }
        return response;
    };
    return EllicitCuisineHandler;
}(CustomHandler));
var EllicitBookingTimeHandler = /** @class */ (function (_super) {
    __extends(EllicitBookingTimeHandler, _super);
    function EllicitBookingTimeHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EllicitBookingTimeHandler.prototype.handleRequest = function (event) {
        var response = null;
        if (!event.currentIntent.slots.BookingTime) {
            response = getElicitSlotResponse('BookingTime', 'What time would you like to make a reservation?', event.currentIntent.slots);
        }
        else if (event.currentIntent.slots.BookingTime && event.currentIntent.slots.BookingDate &&
            !isValidBookingTime(event.currentIntent.slots.BookingDate, event.currentIntent.slots.BookingTime)) {
            response = getElicitSlotResponse('BookingTime', 'I am sorry, we can only make reservations in the future. Could you please provide a valid booking time?', event.currentIntent.slots);
        }
        return response;
    };
    return EllicitBookingTimeHandler;
}(CustomHandler));
var EllicitBookingDateHandler = /** @class */ (function (_super) {
    __extends(EllicitBookingDateHandler, _super);
    function EllicitBookingDateHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EllicitBookingDateHandler.prototype.handleRequest = function (event) {
        var response = null;
        if (!event.currentIntent.slots.BookingDate) {
            response = getElicitSlotResponse('BookingDate', 'What date would you like to make a reservation for?', event.currentIntent.slots);
        }
        else if (event.currentIntent.slots.BookingDate &&
            !isValidBookingDate(event.currentIntent.slots.BookingDate)) {
            response = getElicitSlotResponse('BookingDate', 'Sorry, we can only make reservations for the future. Please provide a valid date.', event.currentIntent.slots);
        }
        return response;
    };
    return EllicitBookingDateHandler;
}(CustomHandler));
var EllicitNumberOfPeopleHandler = /** @class */ (function (_super) {
    __extends(EllicitNumberOfPeopleHandler, _super);
    function EllicitNumberOfPeopleHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EllicitNumberOfPeopleHandler.prototype.handleRequest = function (event) {
        var response = null;
        if (!event.currentIntent.slots.NumberOfPeople) {
            response = getElicitSlotResponse('NumberOfPeople', 'How many people will be dining?', event.currentIntent.slots);
        }
        else if (event.currentIntent.slots.NumberOfPeople &&
            (+event.currentIntent.slots.NumberOfPeople <= 0 ||
                +event.currentIntent.slots.NumberOfPeople > 100)) {
            response = getElicitSlotResponse('NumberOfPeople', 'I am sorry, could you please provide a valid size for the dining party?', event.currentIntent.slots);
        }
        return response;
    };
    return EllicitNumberOfPeopleHandler;
}(CustomHandler));
var GreetingIntentHandler = /** @class */ (function (_super) {
    __extends(GreetingIntentHandler, _super);
    function GreetingIntentHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GreetingIntentHandler.prototype.handleRequest = function (event) {
        return getCloseResponse('Hi, how can I help?');
    };
    return GreetingIntentHandler;
}(CustomHandler));
var ThankYouIntentHandler = /** @class */ (function (_super) {
    __extends(ThankYouIntentHandler, _super);
    function ThankYouIntentHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ThankYouIntentHandler.prototype.handleRequest = function (event) {
        return getCloseResponse('Happy to help!');
    };
    return ThankYouIntentHandler;
}(CustomHandler));
var DiningSuggestionsIntentHandler = /** @class */ (function (_super) {
    __extends(DiningSuggestionsIntentHandler, _super);
    function DiningSuggestionsIntentHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DiningSuggestionsIntentHandler.prototype.handleRequest = function (event) {
        return null;
    };
    return DiningSuggestionsIntentHandler;
}(CustomHandler));
var greetingIntentHandler = new GreetingIntentHandler();
var thankYouIntentHandler = new ThankYouIntentHandler();
var diningSuggestionIntentHandler = new DiningSuggestionsIntentHandler();
var ellicitPhoneNumberHandler = new EllicitPhoneNumberHandler();
var ellicitEmailAddressHandler = new EllicitEmailAddressHandler();
var ellicitLocalityHandler = new EllicitLocalityHandler();
var ellicitCuisineHandler = new EllicitCuisineHandler();
var ellicitBookingTimeHandler = new EllicitBookingTimeHandler();
var ellicitBookingDateHandler = new EllicitBookingDateHandler();
var ellicitNumberOfPeopleHandler = new EllicitNumberOfPeopleHandler();
diningSuggestionIntentHandler.setNext(ellicitPhoneNumberHandler);
ellicitPhoneNumberHandler.setNext(ellicitEmailAddressHandler);
ellicitEmailAddressHandler.setNext(ellicitLocalityHandler);
ellicitLocalityHandler.setNext(ellicitCuisineHandler);
ellicitCuisineHandler.setNext(ellicitBookingDateHandler);
ellicitBookingDateHandler.setNext(ellicitBookingTimeHandler);
ellicitBookingTimeHandler.setNext(ellicitNumberOfPeopleHandler);
var handler = function (event) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    response = getCloseResponse('Sorry, I didn\'t quite catch that');
                    if (!(event.currentIntent.name == 'GreetingIntent')) return [3 /*break*/, 2];
                    return [4 /*yield*/, greetingIntentHandler.passRequest(event)];
                case 1:
                    response = _a.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!(event.currentIntent.name == 'ThankYouIntent')) return [3 /*break*/, 4];
                    return [4 /*yield*/, thankYouIntentHandler.passRequest(event)];
                case 3:
                    response = _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    if (!(event.currentIntent.name == 'DiningSuggestionsIntent')) return [3 /*break*/, 6];
                    return [4 /*yield*/, diningSuggestionIntentHandler.passRequest(event)];
                case 5:
                    response = _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/, response];
            }
        });
    });
};
exports.handler = handler;
