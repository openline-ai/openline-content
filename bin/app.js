var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { embedDocs, queryEmbeddings } from './indexDocs.js';
import { fetchHTML, extractRelevantText } from './scrapeText.js';
import * as dotenv from 'dotenv';
import Airtable from 'airtable';
import * as readline from 'readline';
dotenv.config();
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
function getCommandLineArgs() {
    const args = process.argv.slice(2);
    const flags = { embed: false, query: false, queryText: undefined };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--embed') {
            flags.embed = true;
        }
        else if (args[i] === '--query') {
            flags.query = true;
            break;
        }
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
        // ...
    }
    else if (query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter your query: ', (queryText) => __awaiter(void 0, void 0, void 0, function* () {
            rl.close();
            const count = 5; // You can adjust the count as per your requirement
            yield queryEmbeddings(queryText, count);
        }));
    }
    else {
        console.error('Usage: yarn start [--embed] [--query]');
        process.exit(1);
    }
});
main().catch((error) => console.error(`Error: ${error.message}`));
