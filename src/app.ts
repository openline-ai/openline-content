import cheerio from 'cheerio'
import axios from 'axios'
import * as dotenv from 'dotenv'
import { Configuration, OpenAIApi} from "openai"

dotenv.config();

function getCommandLineArgs(): { url: string } {
    const args = process.argv.slice(2);
  
    if (args.length !== 1) {
      console.error('Usage: ts-node index.ts <URL>');
      process.exit(1);
    }
  
    return { url: args[0] };
}

async function fetchHTML(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    throw error;
  }
}

function extractSocialLinks(html: string): { [key: string]: string } {
  const $ = cheerio.load(html);

  // Define a mapping from social media site names to URL patterns
  const socialMediaSites = {
    linkedin: 'linkedin.com',
    twitter: 'twitter.com',
    instagram: 'instagram.com',
    facebook: 'facebook.com',
    youtube: 'youtube.com',
    github: 'github.com'
  };

  const socialLinks: { [key: string]: string } = {};

  // Search for all links in the footer
  const links = $('a');

  links.each((_, element) => {
    const link = $(element).attr('href');
    if (link) {
      for (const site in socialMediaSites) {
        // Type assertion here
        if (link.includes(socialMediaSites[site as keyof typeof socialMediaSites])) {
          socialLinks[site] = link;
          break;
        }
      }
    }
  });

  return socialLinks;
}

function extractRelevantText(html: string): string {
  const $ = cheerio.load(html);

  // Remove script and style tags
  $('script, style').remove();

  // Extract text from specific elements like headings and paragraphs
  const textElements = $('h1, h2, h3, h4, h5, h6, p, li');
  const texts: string[] = [];

  textElements.each((_, element) => {
    const text = $(element).text().trim();
    if (text.length > 0) {
      texts.push(text);
    }
  });

  return texts.join(' ');
}  

async function analyzeWebsite(text: string): Promise<string> {
  // Ensure OPENAI_SECRET_KEY is defined
  if (!process.env.OPENAI_SECRET_KEY) {
    throw new Error('Missing environment variable: OPENAI_SECRET_KEY');
  }

  // OpenAI configuration creation
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_SECRET_KEY,
  });

  const openaiClient = new OpenAIApi(configuration);

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
  const completion = await openaiClient.createCompletion({
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
}

async function getJson(website: string, analysis: string, socials: { [key: string]: string }): Promise<{analysis: string}> {
  // Ensure OPENAI_SECRET_KEY is defined
  if (!process.env.OPENAI_SECRET_KEY) {
    throw new Error('Missing environment variable: OPENAI_SECRET_KEY');
  }

  // OpenAI configuration creation
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_SECRET_KEY,
  });

  const openaiClient = new OpenAIApi(configuration);

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
  const completion = await openaiClient.createCompletion({
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
  console.log('')

  // Trim whitespace and newline characters
  const cleanedAnalysis = cleanText.trim();

  // Try parsing the cleaned analysis as JSON
  let parsedAnalysis;
  try {
    parsedAnalysis = JSON.parse(cleanedAnalysis);
  } catch (err) {
    console.error('Error parsing analysis as JSON:', err);
    throw err;
  }

  return parsedAnalysis;
}


async function main(): Promise<void> {
    const { url } = getCommandLineArgs();
    const html = await fetchHTML(url);
    const text = extractRelevantText(html);
    const socialLinks = extractSocialLinks(html);
    console.log("Found social links...")
    const data = await analyzeWebsite(text);
    console.log("Analyzing and preparing data output...")
    const output = await getJson(url, data, socialLinks)
    console.log(output)
  }
  
  main().catch((error) => console.error(`Error: ${error.message}`));