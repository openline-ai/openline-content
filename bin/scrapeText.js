var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import cheerio from 'cheerio';
import axios from 'axios';
export function fetchHTML(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios.get(url);
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching URL: ${url}`);
            throw error;
        }
    });
}
function getTextFromElement(element) {
    const text = element.contents().map((_, el) => {
        var _a;
        if (el.type === 'text') {
            return ((_a = el.data) === null || _a === void 0 ? void 0 : _a.trim()) || '';
        }
        else if (el.type === 'tag' && el.name === 'br') {
            return '\n';
        }
        else {
            return '';
        }
    }).get().join('');
    return text.trim();
}
export function extractRelevantText(url, html) {
    return __awaiter(this, void 0, void 0, function* () {
        const $ = cheerio.load(html);
        // Remove script and style tags
        $('script, style').remove();
        // Extract text from relevant elements
        const relevantElements = $('body').find('p, h1, h2, h3, h4, h5, h6, li');
        const paragraphs = [];
        relevantElements.each((_, element) => {
            const text = getTextFromElement($(element));
            if (text.length > 0 && !paragraphs.includes(text)) {
                paragraphs.push(text);
            }
        });
        return { sourceUrl: url, paragraphs };
    });
}
