import { DocumentObject, embedDocs, queryEmbeddings } from './indexDocs.js';
import { fetchHTML, extractRelevantText } from './scrapeText.js'
import * as dotenv from 'dotenv';
import Airtable from 'airtable';

dotenv.config();
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

function getCommandLineArgs(): { embed: boolean; query: boolean; url?: string } {
  const args = process.argv.slice(2);
  const flags = { embed: false, query: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--embed') flags.embed = true;
    else if (args[i] === '--query') flags.query = true;
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
    const records = await fetchAirtableRecords();
    for (const record of records) {
      const source = record.get('Source');
      if (typeof source === 'string') {
        await createEmbeddings(source);
        console.log('Creating embeddings for', source)
        const recordId = record.id;
        if (recordId) {
          await base('source').update(recordId, { 'Vectorized': true });
        } else {
          console.error(`Record with source ${source} does not have an id.`);
        }
      } else {
        console.error(`Record with id ${record.id} does not have a source.`);
      }
    }
  } else if (query) {
    // We'll implement this later
  } else {
    console.error('Usage: yarn start [--embed] [--query]');
    process.exit(1);
  }
};

main().catch((error) => console.error(`Error: ${error.message}`));
