var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { embedDocs } from './indexDocs.js';
import { fetchHTML, extractRelevantText } from './scrapeText.js';
import * as dotenv from 'dotenv';
import Airtable from 'airtable';
dotenv.config();
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
function getCommandLineArgs() {
    const args = process.argv.slice(2);
    const flags = { embed: false, query: false };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--embed')
            flags.embed = true;
        else if (args[i] === '--query')
            flags.query = true;
    }
    return flags;
}
const fetchAirtableRecords = () => __awaiter(void 0, void 0, void 0, function* () {
    const records = yield base('source').select({
        filterByFormula: "AND({Type} = 'Article', NOT(Vectorized))",
    }).firstPage();
    return records;
});
export const createEmbeddings = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const html = yield fetchHTML(url);
    const documents = yield extractRelevantText(url, html);
    yield embedDocs([documents]);
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const { embed, query } = getCommandLineArgs();
    if (embed) {
        const records = yield fetchAirtableRecords();
        console.log(records);
        for (const record of records) {
            const source = record.get('Source');
            if (typeof source === 'string') {
                yield createEmbeddings(source);
                console.log('Creating embeddings for', source);
                const recordId = record.id;
                if (recordId) {
                    yield base('source').update(recordId, { 'Vectorized': true });
                }
                else {
                    console.error(`Record with source ${source} does not have an id.`);
                }
            }
            else {
                console.error(`Record with id ${record.id} does not have a source.`);
            }
        }
    }
    else if (query) {
        // We'll implement this later
    }
    else {
        console.error('Usage: yarn start [--embed] [--query]');
        process.exit(1);
    }
});
main().catch((error) => console.error(`Error: ${error.message}`));
