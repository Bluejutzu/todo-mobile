import axios from 'axios';

export interface AIChatMessage {
  role: string;
  content: string;
}

export async function postAIChatCompletion(
  url: string,
  apiKey: string,
  model: string,
  messages: AIChatMessage[]
) {
  return axios.post(
    url,
    {
      model,
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://todo-mobile.app',
        'X-Title': 'Todo Mobile App',
      },
    }
  );
}
