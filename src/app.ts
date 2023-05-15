import cheerio from 'cheerio';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { OpenAIApi, Configuration } from 'openai';

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

async function extractRelevantText(html: string): Promise<any> {
  const $ = cheerio.load(html);

  // Remove script and style tags
  $('script, style').remove();

  // Extract text from all leaf nodes (elements with no child elements)
  const leafNodes = $('*:not(:has(*))');
  const texts: string[] = [];

  leafNodes.each((_, element) => {
    const text = $(element).text().trim();
    if (text.length > 0 && !texts.includes(text)) {
      texts.push(text);
    }
  });

  const clean = texts.join(' ');
  return clean
}

export const run = async () => {
  const { url } = getCommandLineArgs();
  const html = await fetchHTML(url);
  const text = await extractRelevantText(html);
  console.log(text);
};

run().catch((error) => console.error(`Error: ${error.message}`));
