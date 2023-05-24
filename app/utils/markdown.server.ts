import { Converter } from "showdown";

export function MarkdownToHTML(markdown: string) {
    const converter = new Converter();
    converter.setFlavor("github");

    return converter.makeHtml(markdown);
}
