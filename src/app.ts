import cheerio from 'cheerio';
import axios from 'axios';
import * as dotenv from 'dotenv';

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

function getTextFromElement(element: cheerio.Cheerio): string {
  const text = element.contents().map((_, el) => {
    if (el.type === 'text') {
      return el.data?.trim() || '';
    } else if (el.type === 'tag' && el.name === 'br') {
      return '\n';
    } else {
      return '';
    }
  }).get().join('');

  return text.trim();
}

async function extractRelevantText(html: string): Promise<string> {
  const $ = cheerio.load(html);

  // Remove script and style tags
  $('script, style').remove();

  // Extract text from relevant elements
  const relevantElements = $('body').find('p, h1, h2, h3, h4, h5, h6, li');
  const texts: string[] = [];

  relevantElements.each((_, element) => {
    const text = getTextFromElement($(element));
    if (text.length > 0 && !texts.includes(text)) {
      texts.push(text);
    }
  });

  const cleanText = texts.join('\n');
  return cleanText;
}

export const run = async () => {
  const { url } = getCommandLineArgs();
  const html = await fetchHTML(url);
  const text = await extractRelevantText(html);
  console.log(text);
};

run().catch((error) => console.error(`Error: ${error.message}`));
