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
function extractSocialLinks(html) {
    const $ = cheerio_1.default.load(html);
    // Define a mapping from social media site names to URL patterns
    const socialMediaSites = {
        linkedin: 'linkedin.com',
        twitter: 'twitter.com',
        instagram: 'instagram.com',
        facebook: 'facebook.com',
        youtube: 'youtube.com',
        github: 'github.com'
    };
    const socialLinks = {};
    // Search for all links in the footer
    const links = $('a');
    links.each((_, element) => {
        const link = $(element).attr('href');
        if (link) {
            for (const site in socialMediaSites) {
                // Type assertion here
                if (link.includes(socialMediaSites[site])) {
                    socialLinks[site] = link;
                    break;
                }
            }
        }
    });
    return socialLinks;
}
function extractRelevantText(html) {
    const $ = cheerio_1.default.load(html);
    // Remove script and style tags
    $('script, style').remove();
    // Extract text from specific elements like headings and paragraphs
    const textElements = $('h1, h2, h3, h4, h5, h6, p, li');
    const texts = [];
    textElements.each((_, element) => {
        const text = $(element).text().trim();
        if (text.length > 0) {
            texts.push(text);
        }
    });
    return texts.join(' ');
}
function analyzeWebsite(text) {
    return __awaiter(this, void 0, void 0, function* () {
        // Ensure OPENAI_SECRET_KEY is defined
        if (!process.env.OPENAI_SECRET_KEY) {
            throw new Error('Missing environment variable: OPENAI_SECRET_KEY');
        }
        // OpenAI configuration creation
        const configuration = new openai_1.Configuration({
            apiKey: process.env.OPENAI_SECRET_KEY,
        });
        const openaiClient = new openai_1.OpenAIApi(configuration);
        const prompt = `Analyze the following text from a company website.  
  
  ${text}
  
  Analyze the text and respond (in English) as defined below:

    {
    companyName:  the name of the company
    market: options are B2B, B2C, or Marketplace
    industry: Industry per the Global Industry Classification Standard (GISB),
    industryGroup: Industry Group per the Global Industry Classification Standard (GISB),
    subIndustry: Sub-industry per the Global Industry Classification Standard (GISB),
    targetAudience: analysis of the company's target audience,
    valueProposition: analysis of the company's core value proposition
    }

  `;
        // OpenAI instance creation
        const completion = yield openaiClient.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 400,
        });
        // Ensure choices exist and contain at least one item
        if (!completion.data.choices || completion.data.choices.length === 0) {
            throw new Error('No data returned from OpenAI API');
        }
        // Ensure text exists
        const cleanText = completion.data.choices[0].text;
        if (!cleanText) {
            throw new Error('No text returned from OpenAI API');
        }
        // Trim whitespace and newline characters
        const analysis = cleanText.trim();
        return analysis;
    });
}
function getJson(website, analysis, socials) {
    return __awaiter(this, void 0, void 0, function* () {
        // Ensure OPENAI_SECRET_KEY is defined
        if (!process.env.OPENAI_SECRET_KEY) {
            throw new Error('Missing environment variable: OPENAI_SECRET_KEY');
        }
        // OpenAI configuration creation
        const configuration = new openai_1.Configuration({
            apiKey: process.env.OPENAI_SECRET_KEY,
        });
        const openaiClient = new openai_1.OpenAIApi(configuration);
        const prompt = `The following is data scraped from a website:  Please combine and format the data into a clean json response
  
  ${analysis}

  website: ${website}

  ${JSON.stringify(socials)}

  --------

  Put the data above in the following JSON structure

  {
    "companyName": "..",
    "website": "..",
    "market": "..",
    "industry": "..",
    "industryGroup": "..",
    "subIndustry": "..",
    "targetAudience": "..",
    "valueProposition": "..",
    "linkedin": "..",
    "twitter": "..",
    "instagram": "..",
    "facebook": "..",
    "youtube": "..",
    "github": "..",
  }

  If you do not have data for a given key, do not return it as part of the JSON objext.

  Ensure before you output that your response is valid JSON.  If it is not valid JSON, do you best to fix the formatting to align to valid JSON.

  `;
        // OpenAI instance creation
        const completion = yield openaiClient.createCompletion({
            model: 'text-davinci-003',
            prompt,
            max_tokens: 400,
        });
        // Ensure choices exist and contain at least one item
        if (!completion.data.choices || completion.data.choices.length === 0) {
            throw new Error('No data returned from OpenAI API');
        }
        // Ensure text exists
        const cleanText = completion.data.choices[0].text;
        if (!cleanText) {
            throw new Error('No text returned from OpenAI API');
        }
        //console.log('Text to parse:', cleanText);
        console.log('');
        // Trim whitespace and newline characters
        const cleanedAnalysis = cleanText.trim();
        // Try parsing the cleaned analysis as JSON
        let parsedAnalysis;
        try {
            parsedAnalysis = JSON.parse(cleanedAnalysis);
        }
        catch (err) {
            console.error('Error parsing analysis as JSON:', err);
            throw err;
        }
        return parsedAnalysis;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const { url } = getCommandLineArgs();
        const html = yield fetchHTML(url);
        const text = extractRelevantText(html);
        const socialLinks = extractSocialLinks(html);
        console.log("Found social links...");
        const data = yield analyzeWebsite(text);
        console.log("Analyzing and preparing data output...");
        const output = yield getJson(url, data, socialLinks);
        console.log(output);
    });
}
main().catch((error) => console.error(`Error: ${error.message}`));
