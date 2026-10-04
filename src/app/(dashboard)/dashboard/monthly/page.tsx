import { psychologistApi } from "@/lib/api/psychologist";
import { MonthlyOverview } from "@/features/monthly/components/MonthlyOverview";

type Params = Record<string, string | string[] | undefined>;

const num = (value: string | string[] | undefined) => (typeof value === "string" ? Number(value) : NaN);

export default async function MonthlyPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const now = new Date();
  const year = Number.isInteger(num(params.year)) && num(params.year) >= 2000 && num(params.year) <= 2100 ? num(params.year) : now.getFullYear();
  const month = Number.isInteger(num(params.month)) && num(params.month) >= 1 && num(params.month) <= 12 ? num(params.month) : now.getMonth() + 1;
  const overview = await psychologistApi.getMonthlyOverview(year, month);
  return <MonthlyOverview overview={overview} />;
}
