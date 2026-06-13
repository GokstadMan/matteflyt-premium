import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Sigma, Plus, Trash2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  listCourses,
  listLessons,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  checkIsAdmin,
  claimFirstAdmin,
  type Course,
  type Lesson,
} from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Kurs og leksjoner — MatteFlyt" },
      { name: "description", content: "Administrer kurs og leksjoner i MatteFlyt-bibliotektet." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const checkAdmin = useServerFn(checkIsAdmin);
  const claim = useServerFn(claimFirstAdmin);
  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });
  const qc = useQueryClient();

  if (admin.isLoading) return <Shell><p className="text-muted-foreground">Sjekker tilgang…</p></Shell>;

  if (!admin.data?.isAdmin) {
    return (
      <Shell>
        <div className="glass-card rounded-3xl p-8 max-w-xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h2 className="text-xl font-bold">Admin-tilgang kreves</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Denne siden er kun for admins. Hvis dette er en ny installasjon, kan du gjøre
            deg selv til første admin.
          </p>
          <button
            onClick={async () => {
              try {
                await claim();
                toast.success("Du er nå admin");
                qc.invalidateQueries({ queryKey: ["is-admin"] });
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Gjør meg til admin
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <AdminContent />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen gradient-hero-bg pb-20">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg shadow-soft">
              <Sigma className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-bold tracking-tight">Innholds-admin</span>
          </div>
          <div className="w-20" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pt-10">{children}</main>
    </div>
  );
}

function AdminContent() {
  const qc = useQueryClient();
  const fetchCourses = useServerFn(listCourses);
  const createCourse = useServerFn(adminCreateCourse);
  const updateCourse = useServerFn(adminUpdateCourse);
  const deleteCourse = useServerFn(adminDeleteCourse);
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => fetchCourses() });
  const [selected, setSelected] = useState<string | null>(null);

  async function addCourse() {
    try {
      const row = await createCourse({
        data: {
          title: "Nytt kurs",
          description: "",
          topic: "Generelt",
          difficulty: "Medium",
          sort_order: (courses.data?.length ?? 0) + 1,
          published: false,
        },
      });
      qc.invalidateQueries({ queryKey: ["courses"] });
      setSelected(row.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <section className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Kurs</h2>
          <button
            onClick={addCourse}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Nytt
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {(courses.data ?? []).map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c.id)}
                className={`w-full text-left rounded-xl px-3 py-2 text-sm transition ${
                  selected === c.id ? "bg-primary/10 font-semibold" : "hover:bg-primary/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{c.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {c.published ? "Publisert" : "Utkast"}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        {selected ? (
          <CourseEditor
            course={courses.data!.find((c) => c.id === selected)!}
            onSave={async (patch) => {
              await updateCourse({ data: { id: selected, patch } });
              toast.success("Lagret");
              qc.invalidateQueries({ queryKey: ["courses"] });
            }}
            onDelete={async () => {
              if (!confirm("Slett kurs og alle leksjoner?")) return;
              await deleteCourse({ data: { id: selected } });
              toast.success("Slettet");
              setSelected(null);
              qc.invalidateQueries({ queryKey: ["courses"] });
            }}
          />
        ) : (
          <div className="glass-card rounded-3xl p-10 text-center text-muted-foreground">
            Velg et kurs eller opprett et nytt.
          </div>
        )}
      </section>
    </div>
  );
}

function CourseEditor({
  course,
  onSave,
  onDelete,
}: {
  course: Course;
  onSave: (patch: Partial<Course>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState<Course>(course);
  // reset when switching course
  if (form.id !== course.id) setForm(course);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Rediger kurs</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onSave(form)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Save className="h-4 w-4" /> Lagre
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" /> Slett
            </button>
          </div>
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <Field label="Tittel">
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Emne">
            <input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </Field>
          <Field label="Vanskelighet">
            <input className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
          </Field>
          <Field label="Rekkefølge">
            <input
              type="number"
              className="input"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </Field>
          <Field label="Beskrivelse" full>
            <textarea
              rows={3}
              className="input"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publisert
          </label>
        </div>
      </div>

      <LessonsEditor courseId={course.id} />

      <style>{`
        .input { width:100%; border-radius:0.75rem; border:1px solid hsl(var(--border, 220 13% 91%)); background: var(--card, white); padding:0.55rem 0.75rem; font-size:0.875rem; }
        .input:focus { outline:2px solid var(--primary); }
      `}</style>
    </div>
  );
}

function LessonsEditor({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const fetchLessons = useServerFn(listLessons);
  const createLesson = useServerFn(adminCreateLesson);
  const updateLesson = useServerFn(adminUpdateLesson);
  const deleteLesson = useServerFn(adminDeleteLesson);

  const lessons = useQuery({
    queryKey: ["admin-lessons", courseId],
    queryFn: () => fetchLessons({ data: { courseId } }),
  });

  async function addLesson() {
    try {
      await createLesson({
        data: {
          course_id: courseId,
          title: "Ny leksjon",
          body: "",
          video_url: null,
          duration_minutes: 10,
          xp_reward: 20,
          sort_order: (lessons.data?.length ?? 0) + 1,
          published: false,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-lessons", courseId] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Leksjoner</h2>
        <button
          onClick={addLesson}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Ny leksjon
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {(lessons.data ?? []).map((l) => (
          <LessonRow
            key={l.id}
            lesson={l}
            onSave={async (patch) => {
              await updateLesson({ data: { id: l.id, patch } });
              toast.success("Lagret");
              qc.invalidateQueries({ queryKey: ["admin-lessons", courseId] });
            }}
            onDelete={async () => {
              if (!confirm("Slett leksjon?")) return;
              await deleteLesson({ data: { id: l.id } });
              qc.invalidateQueries({ queryKey: ["admin-lessons", courseId] });
            }}
          />
        ))}
        {lessons.data && lessons.data.length === 0 && (
          <p className="text-sm text-muted-foreground">Ingen leksjoner ennå.</p>
        )}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  onSave,
  onDelete,
}: {
  lesson: Lesson;
  onSave: (patch: Partial<Lesson>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState<Lesson>(lesson);
  if (form.id !== lesson.id) setForm(lesson);
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-start">
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input
          type="number"
          className="input w-20"
          value={form.duration_minutes}
          onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
          title="Minutter"
        />
        <input
          type="number"
          className="input w-20"
          value={form.xp_reward}
          onChange={(e) => setForm({ ...form, xp_reward: Number(e.target.value) })}
          title="XP"
        />
        <label className="flex items-center gap-1.5 text-xs font-semibold">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Publisert
        </label>
      </div>
      <textarea
        className="input mt-2"
        rows={2}
        placeholder="Innhold"
        value={form.body ?? ""}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      <div className="mt-2 flex gap-2 justify-end">
        <button
          onClick={() => onSave(form)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Save className="h-3.5 w-3.5" /> Lagre
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
