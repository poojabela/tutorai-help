import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

export async function getCompletionOutput(prompt: string) {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 512,
    });

    const output = response.data.choices[0].text;

    if (!output) {
      return {
        error: { message: `No output generated!` },
      };
    }

    return { data: output };
  } catch (error) {
    console.error(error);

    return {
      error: { message: `Something wrong with OpenAI! Please try again.` },
    };
  }
}
