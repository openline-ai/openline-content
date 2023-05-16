import { DocumentObject, embedDocs, queryEmbeddings } from './indexDocs.js';
import { fetchHTML, extractRelevantText } from './scrapeText.js';
import * as dotenv from 'dotenv';
import Airtable from 'airtable';
import * as readline from 'readline';

dotenv.config();
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

function getCommandLineArgs(): { embed: boolean; query: boolean; queryText?: string } {
  const args = process.argv.slice(2);
  const flags = { embed: false, query: false, queryText: undefined };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--embed') {
      flags.embed = true;
    } else if (args[i] === '--query') {
      flags.query = true;
      break;
    }
  }

  return flags;
}

const fetchAirtableRecords = async () => {
  const records = await base('source').select({
    filterByFormula: "AND({Type} = 'Article', NOT(Vectorized))",
  }).firstPage();
  return records;
};

export const createEmbeddings = async (url: string) => {
  const html = await fetchHTML(url);
  const documents: DocumentObject = await extractRelevantText(url, html);
  await embedDocs([documents]);
};

const main = async () => {
  const { embed, query } = getCommandLineArgs();

  if (embed) {
    // ...
  } else if (query) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter your query: ', async (queryText) => {
      rl.close();
      const count = 5; // You can adjust the count as per your requirement
      await queryEmbeddings(queryText, count);
    });
  } else {
    console.error('Usage: yarn start [--embed] [--query]');
    process.exit(1);
  }
};

main().catch((error) => console.error(`Error: ${error.message}`));
