import { redirect } from "next/navigation";

export default function FitnessPage() {
  redirect("/profile?tab=fitness");
}
