import { type LoaderArgs, type ActionArgs, json } from "@remix-run/node";
import {
  type ShouldRevalidateFunction,
  Form,
  useActionData,
  useLoaderData,
} from "@remix-run/react";

import { useEffect } from "react";

import {
  badRequest,
  namedAction,
  serverError,
  useGlobalPendingState,
  useGlobalSubmittingState,
} from "remix-utils";

import { getCompletionOutput } from "~/modules/ai";
import PROMPTES from "~/modules/ai/prompts";

import { cx } from "class-variance-authority";

import {
  buttonStyles,
  commonInteractionStyles,
  shimmerStyles,
} from "~/components/ui";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

import { db } from "~/utils/db.server";
import { MarkdownToHTML } from "~/utils/markdown.server";

export async function loader({ request }: LoaderArgs) {
  const searchParams = new URL(request.url).searchParams;

  const { subject } = Object.fromEntries<string | undefined>(searchParams);

  return namedAction(searchParams, {
    async select_subject() {
      if (!subject) {
        return badRequest({
          error: {
            for: "subject",
            message: `Subject is required!`,
          },
        });
      }


      const existingSubject = await db.subject.findUnique({
        where: {
          name: subject
        },
      });

      if (existingSubject) {
        return json({
          subject,
          chapters: existingSubject.sallybus,
        })
      }

      const AIRes = await getCompletionOutput(PROMPTES.getSyllabus(subject));
      if (AIRes.error) {
        return serverError(AIRes);
      }

      let output = AIRes.data;

      console.log(`(Raw) Generated syllabus: `, subject, output);

      output = output.slice(output.indexOf("["), output.lastIndexOf("]") + 1);

      console.log(`(Processed) Generated syllabus: `, subject, output);

      try {
        output = JSON.parse(output);
      } catch (e) {
        console.error(e);

        return serverError({
          error: {
            message: "Error while parsing AI output! Try again.",
          },
        });
      }

      await db.subject.create({
        data: {
          name: subject,
          sallybus: output
        }
      })

      return json({
        subject,

        chapters: output,
      });
    },
    async default() {
      return json({});
    },
  });
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  defaultShouldRevalidate,
  formData,
}) => {
  if (formData?.get("action") === "get_content") {
    return false;
  }
  return defaultShouldRevalidate;
};

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  const { subject, chapter, topic, key } = Object.fromEntries<
    string | undefined
  >(formData as any);

  return namedAction(formData, {
    async get_content() {
      if (!subject || !chapter || !topic) {
        return badRequest({
          error: {
            message: `Subject, chapter & topic are required!`,
          },
        });
      }

      const existingContent = await db.content.findUnique({
        where: {
          subjectName_chapter_topic: {
            subjectName: subject,
            chapter,
            topic
          }
        }
      });

      console.log("Existing", existingContent)

      if (existingContent) {
        return json(
          {
            subject,
            chapter,
            topic,
            key,
    
            content: MarkdownToHTML(existingContent.document),
          }
        )
      }

      const AIRes = await getCompletionOutput(
        PROMPTES.getContent(subject, chapter, topic)
      );
      if (AIRes.error) {
        return serverError(AIRes);
      }

      let output = AIRes.data;

      await db.content.create({
        data: {
          subject: {
            connect: {
              name: subject
            }
          },

          chapter,
          topic,
          document: output
        }
      })

      console.log(`Generated content: `, subject, chapter, topic, output);

      return json({
        subject,
        chapter,
        topic,
        key,

        content: MarkdownToHTML(output),
      });
    },
    async default() {
      return badRequest({
        error: {
          message: `Action not found!`,
        },
      });
    },
  });
}

export default function Index() {
  const loaderData = useLoaderData();
  const actionData = useActionData();

  const isBusy = useGlobalPendingState().includes("pending");
  const isSubmitting = useGlobalSubmittingState().includes("submitting");

  useEffect(
    function () {
      if (loaderData.subject) {
        (
          document.getElementById("firstPageTrigger") as
            | HTMLButtonElement
            | undefined
        )?.click();
      }
    },
    [loaderData.subject]
  );

  useEffect(
    function () {
      if (isSubmitting === true) {
        window.scrollTo(0, 0);
      }
    },
    [isSubmitting]
  );

  return (
    <div className="p-6">
       <div className="flex flex-row items-center justify-start gap-4 mb-4">
          <img src="/logo.png" alt="logo" width={32} height={32} />
          <p className="text-lg font-bold leading-none text-cyan-50">
            TutorAI.help
          </p>
        </div> 
    <div className="flex min-h-screen flex-col items-stretch justify-start gap-6 md:grid md:grid-cols-5 md:grid-rows-1 md:gap-12">
      <div className="col-span-2 flex flex-col items-stretch justify-start gap-8">
        <Form method="GET">
          <input type="hidden" name="action" value="select_subject" />
          <fieldset className="flex flex-row items-center justify-between gap-3 rounded-xl bg-neutral-900 pl-6 pr-3 focus-within:outline focus-within:outline-2 focus-within:outline-cyan-950">
            <input
              type="text"
              id="subject"
              name="subject"
              defaultValue={loaderData.subject}
              placeholder="What do you want to study?"
              className="w-full min-w-0 bg-transparent py-3 font-medium text-cyan-200 placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              autoComplete="off"
              required
              disabled={isBusy}
              readOnly={loaderData.subject}
            />
            {loaderData.subject ? (
              <a href="/" className={buttonStyles()}>
                <ArrowLeftIcon width={18} height={18} />
              </a>
            ) : (
              <button
                type="submit"
                className={buttonStyles({ intent: "primary" })}
                disabled={isBusy}
              >
                <ArrowRightIcon width={18} height={18} />
              </button>
            )}
          </fieldset>
          {loaderData?.error ?
          <p className="text-sm text-red-600 font-medium">{loaderData.error.message}</p> : null}
        </Form>

        {loaderData.subject ? (
          <div className="flex max-w-[300px] flex-col items-stretch justify-start gap-8">
            {loaderData.chapters.map(function (
              chapter: any,
              chapterIndex: number
            ) {
              return (
                <div
                  key={chapter.title}
                  className="flex flex-col items-stretch justify-start gap-4"
                >
                  <p className="break-words text-base font-semibold">
                    {chapter.title}
                  </p>
                  <div className="relative ml-4 flex flex-col items-stretch justify-start gap-2">
                    <div className="absolute -left-[10px] top-0 h-full w-[2px] rounded-full bg-cyan-950/50"></div>
                    {chapter.topics.map(function (
                      topic: any,
                      topicIndex: number
                    ) {
                      const key = encodeURIComponent(
                        `${chapter.title}-${topic}`
                      );

                      return (
                        <Form
                          key={key}
                          method="POST"
                          replace
                          className="relative"
                        >
                          {actionData?.key === key ? (
                            <div className="absolute -left-[10px] top-0 h-full w-[2px] rounded-full bg-cyan-200/50"></div>
                          ) : null}
                          <input
                            type="hidden"
                            name="action"
                            value="get_content"
                          />
                          <input
                            type="hidden"
                            name="subject"
                            value={loaderData.subject}
                          />
                          <input
                            type="hidden"
                            name="chapter"
                            value={chapter.title}
                          />
                          <input type="hidden" name="topic" value={topic} />
                          <input type="hidden" name="key" value={key} />
                          <button
                            type="submit"
                            id={
                              chapterIndex === 0 && topicIndex === 0
                                ? "firstPageTrigger"
                                : undefined
                            }
                            className={cx(
                              "max-w-full break-words text-start text-sm font-medium",
                              actionData?.key === key
                                ? "text-cyan-200"
                                : "text-white",
                              commonInteractionStyles
                            )}
                            disabled={isBusy}
                          >
                            {topic}
                          </button>
                        </Form>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : isBusy ? (
          <div className={shimmerStyles({ className: "h-full w-full" })}></div>
        ) : (
          <Form
            method="GET"
            className="ml-2 flex flex-col items-start justify-start gap-2"
          >
            <input type="hidden" name="action" value="select_subject" />
            <p className="pb-2 text-sm text-neutral-400">
              Try something like...
            </p>
            {[
              "Maths CBSE Class 10",
              "BCA MDSU 3rd year Operating Systems",
              "Javascript",
            ].map(function (subject) {
              return (
                <button
                  key={subject}
                  type="submit"
                  name="subject"
                  value={subject}
                  className={buttonStyles({
                    size: "small",
                    className: "break-words text-start",
                  })}
                  disabled={isBusy}
                >
                  {subject}
                </button>
              );
            })}
          </Form>
        )}
      </div>

      {isBusy ? (
        <div className={shimmerStyles({ className: "col-span-3" })}></div>
      ) : actionData?.content ? (
        <div
          className="prose prose-sm !prose-invert prose-neutral prose-cyan col-span-3"
          dangerouslySetInnerHTML={{
            __html: actionData.content,
          }}
        ></div>
      ) : null}
      {actionData?.error ?
          <p className="text-sm text-red-600 font-medium">{actionData.error.message}</p> : null}
    </div>
    </div>
  );
}
