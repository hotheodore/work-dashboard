import PageHeader from "@/components/PageHeader";
import NotesBoard from "@/components/notes/NotesBoard";
import { getNotes } from "@/lib/store";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await getNotes();
  return (
    <>
      <PageHeader title="Notes" subtitle={`${notes.length} notes`} />
      <NotesBoard notes={notes} />
    </>
  );
}
