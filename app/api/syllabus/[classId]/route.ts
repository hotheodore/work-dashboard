import { getClasses, readSyllabus } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;
  const classes = await getClasses();
  const klass = classes.find((c) => c.id === classId);
  if (!klass?.syllabusPath) return new Response("Not found", { status: 404 });

  const buf = await readSyllabus(klass.syllabusPath);
  if (!buf) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${(klass.syllabusName ?? "syllabus.pdf").replace(/"/g, "")}"`,
    },
  });
}
