import cheerio from 'cheerio';
import axios from 'axios';

export async function fetchHTML(url: string): Promise<string> {
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
  
export async function extractRelevantText(url: string, html: string): Promise<{ sourceUrl: string, paragraphs: string[] }> {
    const $ = cheerio.load(html);
  
    // Remove script and style tags
    $('script, style').remove();
  
    // Extract text from relevant elements
    const relevantElements = $('body').find('p, h1, h2, h3, h4, h5, h6, li');
    const paragraphs: string[] = [];
  
    relevantElements.each((_, element) => {
      const text = getTextFromElement($(element));
      if (text.length > 0 && !paragraphs.includes(text)) {
        paragraphs.push(text);
      }
    });
  
    return { sourceUrl: url, paragraphs };
  }
  
