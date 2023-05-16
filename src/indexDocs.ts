import { PineconeClient } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { VectorDBQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";

dotenv.config();

export interface DocumentObject {
    sourceUrl: string;
    paragraphs: string[];
}
  
export async function embedDocs(documents: DocumentObject[]) {
    const client = new PineconeClient();
    await client.init({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);
  
    const docs = documents.flatMap((doc) => {
      return doc.paragraphs.map((paragraph) => {
        return new Document({
          metadata: { sourceUrl: doc.sourceUrl },
          pageContent: paragraph,
        });
      });
    });
  
    await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
      pineconeIndex,
    });
}

export async function queryEmbeddings(query: string, count: number): Promise<void> {
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!);

  const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {
    pineconeIndex,
  });

  /* Use as part of a chain (currently no metadata filters) */
  const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });
  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: count,
    returnSourceDocuments: true,
  });
  const response = await chain.call({ query: query });

  const text = response.text;

  // Filter out duplicate URLs
  const uniqueUrls = [...new Set(response.sourceDocuments.map((document: any) => document.metadata.sourceUrl))];

  console.log('');
  console.log(text);
  console.log(uniqueUrls);
}
