const stats = [
  { value: "100+", label: "Community events" },
  { value: "2.4k", label: "Helping hands" },
  { value: "12", label: "Neighborhoods" },
];

const steps = [
  "Discover local causes",
  "Join with one click",
  "See your impact",
];

export default function Info() {
  return (
    <div className="mx-auto max-w-7xl px-1 pt-8 font-[family-name:var(--font-geist-sans)] text-[#123c30] sm:px-5 dark:text-[#f8f7f2]">
      <section aria-labelledby="community-heading">
        <h2
          id="community-heading"
          className="text-[10px] font-semibold uppercase text-[#23734e] dark:text-[#e1f28b]"
        >
          Our community at a glance
        </h2>
        <dl className="mt-3.5 grid gap-4 md:grid-cols-3">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex min-h-20 flex-wrap items-center content-center gap-x-2 rounded-[14px] bg-white px-3.5 py-5 text-lg font-bold dark:bg-[#204638]"
            >
              <dt className="order-2">{label}</dt>
              <dd className="order-1">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="participation-heading" className="mt-10 sm:mt-11">
        <h2
          id="participation-heading"
          className="text-[28px] font-bold leading-tight tracking-[-0.025em]"
        >
          Do good, together.
        </h2>
        <p className="mt-2 text-xs text-[#7b9186] dark:text-[#b8cec2]">
          Explore the causes you care about
        </p>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className={`flex min-h-20 items-center gap-1.5 rounded-[14px] px-[18px] py-5 text-sm font-semibold ${
                index === 1
                  ? "bg-[#eaf3e7] dark:bg-[#315b4c]"
                  : "bg-white dark:bg-[#204638]"
              }`}
            >
              <span aria-hidden="true">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
