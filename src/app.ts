import { create } from 'domain';
import { DocumentObject, embedDocs, queryEmbeddings } from './indexDocs.js';
import { fetchHTML, extractRelevantText } from './scrapeText.js'
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

export const createEmbeddings = async () => {
  const { url } = getCommandLineArgs();
  const html = await fetchHTML(url);
  const documents: DocumentObject = await extractRelevantText(url, html);
  await embedDocs([documents]);
};

createEmbeddings().catch((error) => console.error(`Error: ${error.message}`));

//queryEmbeddings('What are customer success plans?', 5)