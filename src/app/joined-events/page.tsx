import PersonalEvents from "@/components/PersonalEvents";
import RequireAuth from "@/components/RequireAuth";

export const metadata = { title: "Joined Events" };

export default function Page() {
  return (
    <main id="main-content" className="container page">
      <div className="page-heading">
        <p className="eyebrow">Your time makes a difference</p>
        <h1>My joined events</h1>
        <p className="muted">Your plans to do good, all in one place.</p>
      </div>
      <RequireAuth>
        <PersonalEvents joined />
      </RequireAuth>
    </main>
  );
}
