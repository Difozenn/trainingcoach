import { redirect } from "next/navigation";

export default async function CalendarRedirect({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", params.year);
  if (params.month) qs.set("month", params.month);
  const query = qs.toString();
  redirect(`/activities${query ? `?${query}` : ""}`);
}
