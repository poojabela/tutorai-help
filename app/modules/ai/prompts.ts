const PROMPTES = {
  getSyllabus(subject: string) {
    return `Task: Generate a JSON array of chapters for the given subject. Every chapter is object which contains 2 properties "title" and "topics". Each topic is an array of strings.
Rules: Return only a JSON. Minify the output by avoiding new-lines and spaces.
Subject: "${subject}"
`;
  },
  getContent(subject: string, chapter: string, topic: string) {
    return `Task: Generate Markdown content for the given topic in context of chapter and subject and follow the type of generation.
    Rules: Do not include subject or chapter in first heading, It should be only topic name. Only include code examples if the subject is programming related. Use tables for differentiations if necessary.
Subject: "${subject}"
Chapter: "${chapter}"
Topic: "${topic}"
Type: "Summary"
`;
  },
} as const;

export default PROMPTES;
