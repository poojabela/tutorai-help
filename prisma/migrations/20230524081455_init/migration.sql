-- CreateTable
CREATE TABLE "Subject" (
    "name" STRING NOT NULL,
    "sallybus" JSONB NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Content" (
    "subjectName" STRING NOT NULL,
    "chapter" STRING NOT NULL,
    "topic" STRING NOT NULL,
    "document" STRING NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("subjectName","chapter","topic")
);

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_subjectName_fkey" FOREIGN KEY ("subjectName") REFERENCES "Subject"("name") ON DELETE CASCADE ON UPDATE CASCADE;
