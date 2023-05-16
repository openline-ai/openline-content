var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PineconeClient } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import { Document } from "langchain/document";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { VectorDBQAChain } from "langchain/chains";
dotenv.config();
export function embedDocs(documents) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new PineconeClient();
        yield client.init({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT,
        });
        const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
        const docs = documents.flatMap((doc) => {
            return doc.paragraphs.map((paragraph) => {
                return new Document({
                    metadata: { sourceUrl: doc.sourceUrl },
                    pageContent: paragraph,
                });
            });
        });
        yield PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
            pineconeIndex,
        });
    });
}
export function queryEmbeddings(query, count) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new PineconeClient();
        yield client.init({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT,
        });
        const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
        const vectorStore = yield PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {
            pineconeIndex,
        });
        /* Use as part of a chain (currently no metadata filters) */
        const model = new OpenAI();
        const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
            k: count,
            returnSourceDocuments: true,
        });
        const response = yield chain.call({ query: query });
        const text = response.text;
        const metadata = response.sourceDocuments.map((document) => document.metadata);
        console.log(text);
        console.log(metadata);
    });
}
