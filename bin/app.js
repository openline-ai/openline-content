var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchHTML, extractRelevantText } from './scrapeText.js';
import * as dotenv from 'dotenv';
dotenv.config();
function getCommandLineArgs() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error('Usage: ts-node index.ts <URL>');
        process.exit(1);
    }
    return { url: args[0] };
}
export const createEmbeddings = () => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = getCommandLineArgs();
    const html = yield fetchHTML(url);
    const documents = yield extractRelevantText(url, html);
    console.log(documents);
    //await embedDocs([documents]);
});
createEmbeddings().catch((error) => console.error(`Error: ${error.message}`));
//queryEmbeddings('What are customer success plans?', 5)
