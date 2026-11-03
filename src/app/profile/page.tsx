import ProfileForm from "@/components/profile-form";

export const metadata = { title: "My Profile" };

export default function Page() {
  return (
    <main id="main-content" className="container page">
      <div className="page-heading">
        <p className="eyebrow">This is you</p>
        <h1>My profile</h1>
        <p className="muted">
          Update how your name and photo appear to the community.
        </p>
      </div>
      <ProfileForm />
    </main>
  );
}
