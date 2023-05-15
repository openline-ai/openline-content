"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const cheerio_1 = __importDefault(require("cheerio"));
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const openai_1 = require("openai");
dotenv.config();
function getCommandLineArgs() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error('Usage: ts-node index.ts <URL>');
        process.exit(1);
    }
    return { url: args[0] };
}
function fetchHTML(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(url);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching URL: ${url}`);
            throw error;
        }
    });
}
function extractRelevantText(html) {
    return __awaiter(this, void 0, void 0, function* () {
        const $ = cheerio_1.default.load(html);
        // Remove script and style tags
        $('script, style').remove();
        // Extract text from all leaf nodes (elements with no child elements)
        const leafNodes = $('*:not(:has(*))');
        const texts = [];
        leafNodes.each((_, element) => {
            const text = $(element).text().trim();
            if (text.length > 0 && !texts.includes(text)) {
                texts.push(text);
            }
        });
        const clean = texts.join(' ');
        const configuration = new openai_1.Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openaiClient = new openai_1.OpenAIApi(configuration);
        const prompt = `The text below is an article scraped off a website. Please cleanup the article so only the text remains.

  ${clean}`;
        const response = yield openaiClient.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 2000,
            temperature: 0.3,
        });
        return response;
    });
}
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = getCommandLineArgs();
    const html = yield fetchHTML(url);
    const text = yield extractRelevantText(html);
    console.log(text);
});
exports.run = run;
(0, exports.run)().catch((error) => console.error(`Error: ${error.message}`));
